import { app, BrowserWindow } from "electron";
import path from "path";
import { registerProfileHandlers, setMainWindow } from "./features/profiles";
import { registerBackupHandlers } from "./features/backup";
import { registerProxyTestHandlers } from "./features/proxyTest";

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 680,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  } else {
    win.loadURL("http://localhost:5173");
  }

  setMainWindow(win);
}

app.whenReady().then(() => {
  const userDataPath = app.getPath("userData");

  registerProfileHandlers(userDataPath);
  registerBackupHandlers(userDataPath);
  registerProxyTestHandlers();

  createWindow();
});
