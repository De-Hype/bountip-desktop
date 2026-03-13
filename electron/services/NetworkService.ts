import { BrowserWindow, net } from "electron";

const CHECK_URL = "https://seal-app-wzqhf.ondigitalocean.app/api/v1"; // Check the actual API

export class NetworkService {
  private online: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private isChecking: boolean = false;
  private consecutiveFailures: number = 0;
  private consecutiveSuccesses: number = 0;

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
      // If OS says offline, go offline immediately to prevent failed sync attempts
      this.consecutiveSuccesses = 0;
      this.updateStatus(false);
    } else {
      // Trigger a check to verify internet access
      this.checkConnectivity();
    }
  }

  private updateStatus(isOnline: boolean) {
    if (isOnline) {
      this.consecutiveFailures = 0;
      this.consecutiveSuccesses++;
      // Switch to online after 1 successful check
      if (this.online !== true && this.consecutiveSuccesses >= 1) {
        this.applyStatus(true);
      }
    } else {
      this.consecutiveSuccesses = 0;
      this.consecutiveFailures++;
      // Be more patient: Only switch to offline after 3 consecutive failed checks (avoid noise from slow internet/glitches)
      if (this.online !== false && this.consecutiveFailures >= 3) {
        this.applyStatus(false);
      }
    }
  }

  private applyStatus(isOnline: boolean) {
    this.online = isOnline;
    console.log(
      `[NetworkService] Status changed to: ${isOnline ? "ONLINE" : "OFFLINE"}`,
    );
    const win = BrowserWindow.getAllWindows()[0];
    if (win && !win.isDestroyed()) {
      win.webContents.send("network:status", { online: this.online });
    }

    // Notify internal listeners
    this.listeners.forEach((cb) => cb(this.online));
  }

  private startConnectivityCheck() {
    // Initial check
    this.checkConnectivity();

    // Check every 10 seconds (less aggressive)
    this.checkInterval = setInterval(() => {
      this.checkConnectivity();
    }, 10000);
  }

  private checkConnectivity() {
    if (this.isChecking) return;
    this.isChecking = true;

    // Use a reliable public DNS or site for connectivity check to avoid false negatives if API is down
    const request = net.request({
      method: "HEAD",
      url: "https://www.google.com",
      redirect: "follow",
    });

    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      request.abort();
      this.isChecking = false;
      // Don't immediately go offline on timeout, could be slow network
      // Only go offline if we were online
      if (this.online) this.checkConnectivityBackup();
      else this.updateStatus(false);
    }, 5000); // 5s Timeout

    request.on("response", (response) => {
      clearTimeout(timeout);
      this.isChecking = false;
      this.updateStatus(true);
    });

    request.on("error", () => {
      if (!timedOut) {
        clearTimeout(timeout);
        this.isChecking = false;
        // Try backup URL (API) before deciding offline
        this.checkConnectivityBackup();
      }
    });

    request.end();
  }

  private checkConnectivityBackup() {
    const request = net.request({
      method: "HEAD",
      url: CHECK_URL,
      redirect: "follow",
    });

    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      request.abort();
      this.updateStatus(false);
    }, 5000);

    request.on("response", () => {
      clearTimeout(timeout);
      this.updateStatus(true);
    });

    request.on("error", () => {
      if (!timedOut) {
        clearTimeout(timeout);
        this.updateStatus(false);
      }
    });

    request.end();
  }
}
