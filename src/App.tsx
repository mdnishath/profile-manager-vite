import { useEffect, useState } from "react";

function App() {
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    window.api.loadProfiles().then(setProfiles);
    window.api.onProfileStopped((name) => {
      setProfiles((prev) =>
        prev.map((p) => (p.name === name ? { ...p, running: false } : p))
      );
    });
  }, []);

  const addProfile = () => {
    const n = profiles.length + 1;
    setProfiles([
      ...profiles,
      {
        id: `profile-${n}`,
        name: `Profile ${n}`,
        path: `profiles/Profile-${n}`,
        proxy: "",
        type: "http",
        running: false,
      },
    ]);
  };

  const saveAll = async () => {
    await window.api.saveProfiles(profiles);
    alert("Profiles saved!");
  };

  const handleLaunch = async (profile: Profile) => {
    if (profile.running) {
      await window.api.stopProfile(profile);
      setProfiles((prev) =>
        prev.map((p) =>
          p.name === profile.name ? { ...p, running: false } : p
        )
      );
    } else {
      await window.api.launchProfile(profile);
      setProfiles((prev) =>
        prev.map((p) => (p.name === profile.name ? { ...p, running: true } : p))
      );
    }
  };

  const removeProfile = async (profile: Profile) => {
    if (!confirm(`Delete ${profile.name}?`)) return;
    await window.api.removeProfile(profile);
    setProfiles((prev) => prev.filter((p) => p.id !== profile.id));
  };

  const updateProfile = (
    index: number,
    field: keyof Profile,
    value: string
  ) => {
    const updated = [...profiles];
    updated[index] = { ...updated[index], [field]: value };
    setProfiles(updated);
  };

  return (
    <div className="h-screen w-full bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-gray-100 transition-colors">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-4 sm:mb-0">
            Profile Manager
          </h1>
          <div className="flex gap-3">
            <button
              onClick={addProfile}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition"
            >
              + Add Profile
            </button>
            <button
              onClick={saveAll}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow transition"
            >
              💾 Save All
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg shadow border border-gray-200 dark:border-zinc-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-zinc-800">
              <tr>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Proxy</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p, i) => (
                <tr
                  key={p.id}
                  className="border-t border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800"
                >
                  {/* ✅ Status dot */}
                  <td className="p-3">
                    <span
                      className={`inline-block w-3 h-3 rounded-full ${
                        p.running ? "bg-green-500" : "bg-gray-400"
                      }`}
                    ></span>
                  </td>

                  {/* Name */}
                  <td className="p-3">
                    <input
                      value={p.name}
                      onChange={(e) => updateProfile(i, "name", e.target.value)}
                      className="border rounded px-2 py-1 w-full dark:bg-zinc-900 dark:border-zinc-600"
                    />
                  </td>

                  {/* Proxy */}
                  <td className="p-3">
                    <input
                      value={p.proxy || ""}
                      onChange={(e) =>
                        updateProfile(i, "proxy", e.target.value)
                      }
                      placeholder="ip:port or user:pass@ip:port"
                      className="border rounded px-2 py-1 w-full dark:bg-zinc-900 dark:border-zinc-600"
                    />
                  </td>

                  {/* Proxy type */}
                  <td className="p-3">
                    <select
                      value={p.type || "http"}
                      onChange={(e) => updateProfile(i, "type", e.target.value)}
                      className="border rounded px-2 py-1 w-full dark:bg-zinc-900 dark:border-zinc-600"
                    >
                      <option value="http">HTTP</option>
                      <option value="socks5">SOCKS5</option>
                    </select>
                  </td>

                  {/* Actions */}
                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => handleLaunch(p)}
                      className={`px-3 py-1 rounded text-white transition ${
                        p.running
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {p.running ? "Stop" : "Launch"}
                    </button>
                    <button
                      onClick={() => removeProfile(p)}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded transition"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
