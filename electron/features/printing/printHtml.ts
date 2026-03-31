import { BrowserWindow } from "electron";

export const printHtml = async (payload: {
  html: string;
  options?: {
    silent?: boolean;
    printBackground?: boolean;
    deviceName?: string;
  };
}) => {
  const html = String(payload?.html || "");
  if (!html.trim()) {
    return { success: false, error: "Empty HTML" };
  }

  const options = payload?.options || {};
  const isSilent = Boolean(options.silent);

  const win = new BrowserWindow({
    show: !isSilent,
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  try {
    const url = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
    await win.loadURL(url);
    await new Promise<void>((resolve) =>
      win.webContents.once("did-finish-load", () => resolve()),
    );

    if (!isSilent) {
      try {
        win.show();
        win.focus();
      } catch {}
    }

    const res = await new Promise<{ success: boolean; error?: string }>(
      (resolve) => {
        win.webContents.print(
          {
            silent: isSilent,
            printBackground: options.printBackground !== false,
            deviceName: options.deviceName,
          },
          (success, failureReason) => {
            if (!success) resolve({ success: false, error: failureReason });
            else resolve({ success: true });
          },
        );
      },
    );

    return res;
  } catch (e) {
    return { success: false, error: String((e as any)?.message || e) };
  } finally {
    try {
      win.close();
    } catch {}
  }
};
