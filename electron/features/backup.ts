import { ipcMain, dialog } from "electron";
import fs from "fs";
import path from "path";
import archiver from "archiver";
import extract from "extract-zip";

// Stopper function injected from main
let stopAllProfiles: (() => Promise<void>) | null = null;
export function setStopper(fn: () => Promise<void>) {
  stopAllProfiles = fn;
}

export function registerBackupHandlers(userDataPath: string) {
  const DATA_FILE = path.join(userDataPath, "profiles.json");
  const BASE_DIR = path.join(userDataPath, "profiles");

  // === BACKUP ===
  ipcMain.handle("backup-profiles", async () => {
    try {
      // ✅ Ensure Chrome profiles stopped
      if (stopAllProfiles) await stopAllProfiles();

      const { filePath } = await dialog.showSaveDialog({
        title: "Save Backup",
        defaultPath: `profile-manager-backup-${Date.now()}.zip`,
        filters: [{ name: "Zip Files", extensions: ["zip"] }],
      });
      if (!filePath) return { ok: false, error: "Cancelled" };

      const output = fs.createWriteStream(filePath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      archive.pipe(output);

      // include JSON + all profile data (with dotfiles)
      if (fs.existsSync(DATA_FILE)) {
        archive.file(DATA_FILE, { name: "profiles.json" });
      }
      if (fs.existsSync(BASE_DIR)) {
        archive.directory(BASE_DIR, "profiles", { dot: true } as any);
      }

      await new Promise<void>((resolve, reject) => {
        output.on("close", resolve);
        output.on("error", reject);
        archive.on("error", reject);
        archive.finalize();
      });

      return { ok: true, filePath };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  });

  // === RESTORE ===
  ipcMain.handle("restore-profiles", async () => {
    try {
      // ✅ Ensure Chrome profiles stopped before overwrite
      if (stopAllProfiles) await stopAllProfiles();

      const { filePaths } = await dialog.showOpenDialog({
        title: "Select Backup File",
        filters: [{ name: "Zip Files", extensions: ["zip"] }],
        properties: ["openFile"],
      });
      if (!filePaths || filePaths.length === 0) {
        return { ok: false, error: "Cancelled" };
      }

      const filePath = filePaths[0];

      // Extract to userDataPath
      await extract(filePath, { dir: userDataPath });

      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  });
}
