import { autoUpdater } from "electron-updater";
import log from "electron-log";
import { BrowserWindow } from "electron";

export class UpdateService {
  constructor() {
    log.transports.file.level = "info";
    autoUpdater.logger = log;
    this.initListeners();
  }

  private formatUpdaterError(err: unknown): string {
    const raw = err instanceof Error ? err.message : String(err ?? "");
    const lower = raw.toLowerCase();

    if (
      lower.includes("not signed by the application owner") ||
      lower.includes("not digitally signed") ||
      lower.includes("signercertificate") ||
      lower.includes("publishernames")
    ) {
      return (
        "Update skipped: this Windows build isn't code-signed. " +
        "Please install updates by downloading the latest installer from the Releases page."
      );
    }

    return "Error in auto-updater. " + raw;
  }

  initListeners() {
    autoUpdater.on("checking-for-update", () => {
      this.sendStatusToWindow("Checking for update...");
    });
    autoUpdater.on("update-available", (info) => {
      this.sendStatusToWindow("Update available.");
      const win = BrowserWindow.getAllWindows()[0];
      if (win) win.webContents.send("updater:update-available", info);
    });
    autoUpdater.on("update-not-available", (info) => {
      this.sendStatusToWindow("Update not available.");
      const win = BrowserWindow.getAllWindows()[0];
      if (win) win.webContents.send("updater:update-not-available", info);
    });
    autoUpdater.on("error", (err) => {
      this.sendStatusToWindow(this.formatUpdaterError(err));
      const win = BrowserWindow.getAllWindows()[0];
      if (win) win.webContents.send("updater:error", err.toString());
    });
    autoUpdater.on("download-progress", (progressObj) => {
      this.sendStatusToWindow("Downloading update...");
      const win = BrowserWindow.getAllWindows()[0];
      if (win) win.webContents.send("updater:download-progress", progressObj);
    });
    autoUpdater.on("update-downloaded", (info) => {
      this.sendStatusToWindow("Update downloaded");
      const win = BrowserWindow.getAllWindows()[0];
      if (win) win.webContents.send("updater:update-downloaded", info);
    });
  }

  sendStatusToWindow(text: string) {
    log.info(text);
    const win = BrowserWindow.getAllWindows()[0];
    if (win) win.webContents.send("updater:status", text);
  }

  checkForUpdates() {
    autoUpdater.checkForUpdates();
  }

  quitAndInstall() {
    autoUpdater.quitAndInstall();
  }

  checkForUpdatesAndNotify() {
    autoUpdater.checkForUpdatesAndNotify();
  }
}
