import { BrowserWindow, net } from "electron";

const CHECK_URL = "https://seal-app-wzqhf.ondigitalocean.app/api/v1"; // Check the actual API

export class NetworkService {
  private online: boolean = false; // Default to false until proven otherwise
  private checkInterval: NodeJS.Timeout | null = null;
  private isChecking: boolean = false;

  private listeners: ((online: boolean) => void)[] = [];

  constructor() {
    this.startConnectivityCheck();
  }

  onStatusChange(cb: (online: boolean) => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  getStatus() {
    return { online: this.online };
  }

  // Called by Frontend (navigator.onLine updates)
  setOnline(flag: boolean) {
    if (!flag) {
      // If frontend says "Cable Unplugged", we are definitely offline.
      this.updateStatus(false);
    } else {
      // If frontend says "Cable Plugged In", we don't believe it yet.
      // We trigger a check to verify internet access.
      this.checkConnectivity();
    }
  }

  private updateStatus(isOnline: boolean) {
    if (this.online !== isOnline) {
      this.online = isOnline;
      console.log(
        `[NetworkService] Status changed to: ${isOnline ? "ONLINE" : "OFFLINE"}`
      );
      const win = BrowserWindow.getAllWindows()[0];
      if (win) win.webContents.send("network:status", { online: this.online });
      
      // Notify internal listeners
      this.listeners.forEach(cb => cb(this.online));
    }
  }

  private startConnectivityCheck() {
    // Initial check
    this.checkConnectivity();

    // Check every 5 seconds
    this.checkInterval = setInterval(() => {
      this.checkConnectivity();
    }, 5000);
  }

  private checkConnectivity() {
    if (this.isChecking) return;
    this.isChecking = true;

    // Use a simple HEAD request to the API root or a known stable endpoint
    // Using a shorter timeout
    const request = net.request({
      method: "HEAD",
      url: CHECK_URL,
      redirect: "follow",
    });

    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      request.abort();
      this.isChecking = false;
      this.updateStatus(false);
    }, 5000); // 5s Timeout

    request.on("response", (response) => {
      clearTimeout(timeout);
      this.isChecking = false;

      // Treat 2xx, 3xx, 4xx as "online" (server is reachable)
      // Treat 5xx as "online" too (server is reachable but has error)
      // Only network errors (DNS, timeout, connection refused) are "offline"
      this.updateStatus(true);
    });

    request.on("error", () => {
      if (!timedOut) {
        clearTimeout(timeout);
        this.isChecking = false;
        this.updateStatus(false);
      }
    });

    request.end();
  }
}
