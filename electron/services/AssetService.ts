import { app, protocol, net } from "electron";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { P2PService } from "./P2PService";

const ASSET_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
  ".gif",
  ".webp",
  ".woff",
  ".woff2",
  ".ttf",
];
const ASSET_DIR = path.join(app.getPath("userData"), "assets");

if (!fs.existsSync(ASSET_DIR)) {
  fs.mkdirSync(ASSET_DIR, { recursive: true });
}

export class AssetService {
  private p2pService: P2PService;
  private pendingRequests = new Map<string, (data: Buffer | null) => void>();

  constructor(p2pService: P2PService) {
    this.p2pService = p2pService;
    this.initP2P();
    this.initProtocol();
  }

  private getHash(url: string) {
    return crypto.createHash("md5").update(url).digest("hex");
  }

  private getFilePath(url: string) {
    const hash = this.getHash(url);
    const ext = path.extname(new URL(url).pathname) || ".bin";
    return path.join(ASSET_DIR, `${hash}${ext}`);
  }

  importLocalAsset(sourcePath: string): string {
    const ext = path.extname(sourcePath);
    const hash = crypto
      .createHash("md5")
      .update(sourcePath + Date.now().toString())
      .digest("hex");
    const filename = `${hash}${ext}`;
    const destPath = path.join(ASSET_DIR, filename);
    fs.copyFileSync(sourcePath, destPath);
    return `file://${destPath}`;
  }

  private initP2P() {
    this.p2pService.onMessage((payload) => {
      if (payload.type === "REQUEST_ASSET") {
        this.handleAssetRequest(payload);
      } else if (payload.type === "RESPONSE_ASSET") {
        this.handleAssetResponse(payload);
      }
    });
  }

  private async handleAssetRequest(payload: any) {
    const { url, requestId } = payload;
    const filePath = this.getFilePath(url);
    if (fs.existsSync(filePath)) {
      try {
        const data = fs.readFileSync(filePath);
        // Send back to the requester
        // We broadcast purely because we might not know the exact peer IP easily in this simplified service,
        // but ideally we should send unicast. P2PService supports unicast if we knew the ID.
        // For now, broadcast is "okay" for small networks, but risky for bandwidth.
        // Let's assume we broadcast for now.
        this.p2pService.broadcast({
          type: "RESPONSE_ASSET",
          requestId,
          url,
          data: data.toString("base64"),
        });
      } catch (e) {
        console.error("Error reading asset for P2P:", e);
      }
    }
  }

  private handleAssetResponse(payload: any) {
    const { requestId, data, url } = payload;
    if (this.pendingRequests.has(requestId)) {
      const resolve = this.pendingRequests.get(requestId);
      if (resolve) {
        const buffer = Buffer.from(data, "base64");
        // Save to cache
        const filePath = this.getFilePath(url);
        fs.writeFileSync(filePath, buffer);
        resolve(buffer);
        this.pendingRequests.delete(requestId);
      }
    }
  }

  private initProtocol() {
    // We only want to intercept strict static assets.
    // WARNING: This is a powerful API.
    protocol.handle("https", async (request) => {
      const url = request.url;
      const cleanUrl = url.split("?")[0].toLowerCase();

      const isAsset = ASSET_EXTENSIONS.some((ext) => cleanUrl.endsWith(ext));

      if (!isAsset) {
        // Passthrough for non-assets (API calls, HTML, etc.)
        return net.fetch(request, { bypassCustomProtocolHandlers: true });
      }

      // 1. Check Local Cache
      const filePath = this.getFilePath(url);
      if (fs.existsSync(filePath)) {
        console.log(`[AssetService] Serving from cache: ${url}`);
        // Convert file path to file:// URL which net.fetch handles correctly
        const fileUrl = `file://${filePath}`;
        return net.fetch(fileUrl);
      }

      // 2. If Online, Fetch & Cache
      // We can check navigator.onLine equivalent or just try fetching.
      try {
        const response = await net.fetch(request, {
          bypassCustomProtocolHandlers: true,
        });
        if (response.ok) {
          // Clone the response to cache it?
          // net.fetch response body can be read once.
          const buffer = await response.arrayBuffer();
          fs.writeFileSync(filePath, Buffer.from(buffer));
          return new Response(buffer, {
            headers: response.headers,
            status: response.status,
            statusText: response.statusText,
          });
        }
      } catch (e) {
        console.log(`[AssetService] Fetch failed, trying P2P: ${url}`);
      }

      // 3. If Offline/Failed, Try P2P
      const p2pData = await this.requestFromPeers(url);
      if (p2pData) {
        return new Response(p2pData as unknown as BodyInit);
      }

      // 4. Give up
      return new Response("Not Found", { status: 404 });
    });
  }

  private requestFromPeers(url: string): Promise<Buffer | null> {
    return new Promise((resolve) => {
      const requestId = crypto.randomUUID();

      // Timeout after 3 seconds
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        resolve(null);
      }, 3000);

      this.pendingRequests.set(requestId, (data) => {
        clearTimeout(timeout);
        resolve(data);
      });

      this.p2pService.broadcast({
        type: "REQUEST_ASSET",
        requestId,
        url,
      });
    });
  }
}
