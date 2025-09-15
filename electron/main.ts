import { app, BrowserWindow, ipcMain } from "electron";
import { spawn, exec } from "child_process";
import fs from "fs";
import path from "path";
import rimraf from "rimraf";

let mainWindow: BrowserWindow | null = null;

const BROWSER_PATH =
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const userDataPath = app.getPath("userData");
const DATA_FILE = path.join(userDataPath, "profiles.json");
const BASE_DIR = path.join(userDataPath, "profiles");

const running = new Map<string, any>();

if (!fs.existsSync(BASE_DIR)) {
  fs.mkdirSync(BASE_DIR, { recursive: true });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 680,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (app.isPackaged) {
    // ✅ Load built Vite app with relative paths
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  } else {
    mainWindow.loadURL("http://localhost:5173");
  }
}

app.whenReady().then(createWindow);

function absProfilePath(relPath: string) {
  if (path.isAbsolute(relPath)) return relPath;
  return path.join(userDataPath, relPath);
}

// === Load Profiles ===
ipcMain.handle("load-profiles", async () => {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return parsed.map((p: any) => ({
      ...p,
      path: absProfilePath(p.path),
      running: running.has(p.name),
    }));
  } catch {
    return [];
  }
});

// === Save Profiles ===
ipcMain.handle("save-profiles", async (_e, profiles: any[]) => {
  const sanitized = profiles.map((p) => ({
    ...p,
    path: path.relative(userDataPath, p.path),
  }));
  fs.writeFileSync(DATA_FILE, JSON.stringify(sanitized, null, 2), "utf-8");

  sanitized.forEach((p) => {
    const absPath = absProfilePath(p.path);
    if (!fs.existsSync(absPath)) {
      fs.mkdirSync(absPath, { recursive: true });
    }
  });

  return true;
});

// === Launch Profile ===
ipcMain.handle("launch-profile", async (_e, profile: any) => {
  if (running.has(profile.name)) {
    return { ok: false, error: "Already running" };
  }

  const absPath = absProfilePath(profile.path);
  if (!fs.existsSync(absPath)) fs.mkdirSync(absPath, { recursive: true });

  const args = [`--user-data-dir=${absPath}`, `--profile-directory=Default`];
  if (profile.proxy && profile.proxy.trim()) {
    args.push(`--proxy-server=${profile.proxy.trim()}`);
  }

  const child = spawn(BROWSER_PATH, args, { detached: true, stdio: "ignore" });
  running.set(profile.name, child);

  child.on("exit", () => {
    running.delete(profile.name);
    if (mainWindow) {
      mainWindow.webContents.send("profile-stopped", profile.name);
    }
  });

  return { ok: true };
});

// === Stop Profile ===
ipcMain.handle("stop-profile", async (_e, profile: any) => {
  const child = running.get(profile.name);
  if (!child) return { ok: false, error: "Not running" };

  if (process.platform === "win32") {
    exec(`taskkill /PID ${child.pid} /T /F`, (err) => {
      if (err) console.error("taskkill error:", err);
    });
  } else {
    process.kill(child.pid);
  }

  running.delete(profile.name);
  return { ok: true };
});

// === Remove Profile ===
ipcMain.handle("remove-profile", async (_e, profile: any) => {
  const absPath = absProfilePath(profile.path);
  if (fs.existsSync(absPath)) rimraf.sync(absPath);

  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    let profiles = JSON.parse(raw);
    profiles = profiles.filter((p: any) => p.name !== profile.name);
    fs.writeFileSync(DATA_FILE, JSON.stringify(profiles, null, 2), "utf-8");
  }

  return { ok: true };
});
