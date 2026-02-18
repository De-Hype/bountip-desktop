import dgram from "dgram";
import net from "net";
import { BrowserWindow } from "electron";

const APP_ID = "bountip";
const MULTICAST_ADDR = "239.192.0.1";
const MULTICAST_PORT = 45454;

export class P2PService {
  private tcpPort: number = 0;
  private udpSocket: dgram.Socket | null = null;
  private tcpServer: net.Server | null = null;
  private peers = new Map<string, { ip: string; port: number }>();
  private deviceId: string;
  private listeners: ((payload: any, deviceId?: string) => void)[] = [];

  constructor(deviceId: string) {
    this.deviceId = deviceId;
  }

  onMessage(cb: (payload: any, deviceId?: string) => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  start() {
    this.startTcpServer((payload) => {
      // Notify all internal listeners (like AssetService)
      this.listeners.forEach((cb) => cb(payload));

      // Notify Frontend
      const win = BrowserWindow.getAllWindows()[0];
      if (win) win.webContents.send("p2p:message", payload);
    });
    this.startUdpDiscovery();
  }

  private startTcpServer(onMessage: (payload: any) => void) {
    this.tcpServer = net.createServer((socket) => {
      socket.on("data", (data) => {
        try {
          const str = data.toString();
          const json = JSON.parse(str);
          if (json.app === APP_ID && json.payload) {
            onMessage(json.payload);
          }
        } catch {}
      });
    });

    this.tcpServer.listen(0, () => {
      this.tcpPort = (this.tcpServer!.address() as net.AddressInfo).port;
    });
  }

  private startUdpDiscovery() {
    this.udpSocket = dgram.createSocket({ type: "udp4", reuseAddr: true });

    this.udpSocket.on("error", (err) => {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === "EADDRNOTAVAIL") {
        console.warn(
          "[P2PService] Multicast address not available. P2P discovery disabled.",
        );
        this.udpSocket?.close();
        this.udpSocket = null;
        return;
      }

      console.error("[P2PService] UDP socket error:", err);
    });

    this.udpSocket.on("message", (msg, rinfo) => {
      try {
        const json = JSON.parse(msg.toString());
        if (json.app === APP_ID && json.deviceId !== this.deviceId) {
          if (!this.peers.has(json.deviceId)) {
            this.peers.set(json.deviceId, {
              ip: rinfo.address,
              port: json.tcpPort,
            });
          }
        }
      } catch {}
    });

    this.udpSocket.bind(MULTICAST_PORT, () => {
      try {
        this.udpSocket?.addMembership(MULTICAST_ADDR);
        this.udpSocket?.setMulticastLoopback(true);
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code;
        if (code === "EADDRNOTAVAIL") {
          console.warn(
            "[P2PService] addMembership failed with EADDRNOTAVAIL. P2P discovery disabled.",
          );
          this.udpSocket?.close();
          this.udpSocket = null;
          return;
        }

        console.error(
          "[P2PService] Unexpected error during multicast setup:",
          err,
        );
      }
    });

    setInterval(() => {
      const msg = JSON.stringify({
        app: APP_ID,
        deviceId: this.deviceId,
        tcpPort: this.tcpPort,
      });
      this.udpSocket?.send(msg, MULTICAST_PORT, MULTICAST_ADDR);
    }, 3000);
  }

  getPeers() {
    return Array.from(this.peers.values());
  }

  // New method to get active devices sorted (or just list them to decide leader)
  getDevices() {
    return Array.from(this.peers.keys());
  }

  getDeviceId() {
    return this.deviceId;
  }

  async broadcast(payload: any) {
    const list = Array.from(this.peers.values());
    for (const p of list) {
      try {
        await this.sendToPeer(p, { app: APP_ID, payload });
      } catch {}
    }
  }

  async sendToPeerById(deviceId: string, payload: any) {
    const p = this.peers.get(deviceId);
    if (!p) return;
    try {
      await this.sendToPeer(p, { app: APP_ID, payload });
    } catch (e) {
      console.error("sendToPeer error", e);
    }
  }

  private sendToPeer(peer: { ip: string; port: number }, data: any) {
    return new Promise<void>((resolve, reject) => {
      const client = new net.Socket();
      client.connect(peer.port, peer.ip, () => {
        client.write(JSON.stringify(data));
        client.end();
        resolve();
      });
      client.on("error", reject);
    });
  }
}
