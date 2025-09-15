export {};

declare global {
  interface Profile {
    id: string;
    name: string;
    path: string;
    proxy?: string;
    type?: string;
    running: boolean;
  }

  interface TestProxyResult {
    ok: boolean;
    ip?: string;
    city?: string;
    region?: string;
    country?: string;
    org?: string;
    error?: string;
  }

  interface Window {
    api: {
      // Profiles
      loadProfiles: () => Promise<Profile[]>;
      saveProfiles: (profiles: Profile[]) => Promise<boolean>;
      launchProfile: (profile: Profile) => Promise<any>;
      stopProfile: (profile: Profile) => Promise<any>;
      removeProfile: (profile: Profile) => Promise<any>;
      onProfileStopped: (callback: (name: string) => void) => void;

      // Backup
      backupProfiles: () => Promise<{
        ok: boolean;
        filePath?: string;
        error?: string;
      }>;
      restoreProfiles: () => Promise<{ ok: boolean; error?: string }>;

      // Proxy test
      testProxy: (payload: {
        proxy: string;
        type?: string;
      }) => Promise<TestProxyResult>;
    };
  }
}
