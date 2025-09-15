declare global {
  interface Window {
    api: {
      loadProfiles: () => Promise<Profile[]>;
      saveProfiles: (profiles: Profile[]) => Promise<boolean>;
      launchProfile: (profile: Profile) => Promise<any>;
      stopProfile: (profile: Profile) => Promise<any>;
      removeProfile: (profile: Profile) => Promise<any>;
      onProfileStopped: (callback: (name: string) => void) => void;
    };
  }

  interface Profile {
    id: string;
    name: string;
    path: string;
    proxy?: string;
    type?: "http" | "socks5";
    running?: boolean;
  }
}

export {};
