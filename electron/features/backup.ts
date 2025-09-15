import { ipcMain, dialog } from "electron";
import fs from "fs";
import archiver from "archiver";
import unzipper from "unzipper";
import path from "path";

export function registerBackupHandlers(userDataPath: string) {
  const DATA_FILE = path.join(userDataPath, "profiles.json");
  const BASE_DIR = path.join(userDataPath, "profiles");

  ipcMain.handle("backup-profiles", async () => {
    try {
      const { filePath } = await dialog.showSaveDialog({
        title: "Save Backup",
        defaultPath: `profile-manager-backup-${Date.now()}.zip`,
        filters: [{ name: "Zip Files", extensions: ["zip"] }],
      });
      if (!filePath) return { ok: false, error: "Cancelled" };

      const output = fs.createWriteStream(filePath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      archive.pipe(output);
      if (fs.existsSync(DATA_FILE))
        archive.file(DATA_FILE, { name: "profiles.json" });
      if (fs.existsSync(BASE_DIR)) archive.directory(BASE_DIR, "profiles");

      await archive.finalize();
      return { ok: true, filePath };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle("restore-profiles", async () => {
    try {
      const { filePaths } = await dialog.showOpenDialog({
        title: "Select Backup File",
        filters: [{ name: "Zip Files", extensions: ["zip"] }],
        properties: ["openFile"],
      });
      if (!filePaths || filePaths.length === 0)
        return { ok: false, error: "Cancelled" };

      const filePath = filePaths[0];
      const stream = fs
        .createReadStream(filePath)
        .pipe(unzipper.Extract({ path: userDataPath }));
      await new Promise((resolve, reject) => {
        stream.on("close", resolve);
        stream.on("error", reject);
      });

      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  });
}
