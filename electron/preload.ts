import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  // Profiles
  loadProfiles: () => ipcRenderer.invoke("load-profiles"),
  saveProfiles: (profiles: any[]) =>
    ipcRenderer.invoke("save-profiles", profiles),
  launchProfile: (profile: any) =>
    ipcRenderer.invoke("launch-profile", profile),
  stopProfile: (profile: any) => ipcRenderer.invoke("stop-profile", profile),
  removeProfile: (profile: any) =>
    ipcRenderer.invoke("remove-profile", profile),
  onProfileStopped: (callback: (name: string) => void) =>
    ipcRenderer.on("profile-stopped", (_e, name) => callback(name)),

  // Backup / Restore
  backupProfiles: () => ipcRenderer.invoke("backup-profiles"),
  restoreProfiles: () => ipcRenderer.invoke("restore-profiles"),

  // Proxy test
  testProxy: (payload: { proxy: string; type?: string }) =>
    ipcRenderer.invoke("test-proxy", payload),
});
