import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { BrowserWindow } from 'electron';

export class UpdateService {
  constructor() {
    log.transports.file.level = "info";
    autoUpdater.logger = log;
    this.initListeners();
  }

  initListeners() {
    autoUpdater.on('checking-for-update', () => {
      this.sendStatusToWindow('Checking for update...');
    });
    autoUpdater.on('update-available', (info) => {
      this.sendStatusToWindow('Update available.');
      const win = BrowserWindow.getAllWindows()[0];
      if (win) win.webContents.send('updater:update-available', info);
    });
    autoUpdater.on('update-not-available', (info) => {
      this.sendStatusToWindow('Update not available.');
      const win = BrowserWindow.getAllWindows()[0];
      if (win) win.webContents.send('updater:update-not-available', info);
    });
    autoUpdater.on('error', (err) => {
      this.sendStatusToWindow('Error in auto-updater. ' + err);
      const win = BrowserWindow.getAllWindows()[0];
      if (win) win.webContents.send('updater:error', err.toString());
    });
    autoUpdater.on('download-progress', (progressObj) => {
      let log_message = "Download speed: " + progressObj.bytesPerSecond;
      log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
      log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
      this.sendStatusToWindow(log_message);
    });
    autoUpdater.on('update-downloaded', (info) => {
      this.sendStatusToWindow('Update downloaded');
      const win = BrowserWindow.getAllWindows()[0];
      if (win) win.webContents.send('updater:update-downloaded', info);
    });
  }

  sendStatusToWindow(text: string) {
    log.info(text);
    const win = BrowserWindow.getAllWindows()[0];
    if (win) win.webContents.send('updater:status', text);
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
