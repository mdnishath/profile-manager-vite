import { ipcMain } from "electron";
import * as https from "https";
import { HttpsProxyAgent } from "https-proxy-agent";
import { SocksProxyAgent } from "socks-proxy-agent";
import type { Agent } from "http";

export function registerProxyTestHandlers() {
  ipcMain.handle(
    "test-proxy",
    async (_e, payload: { proxy: string; type?: string }) => {
      try {
        let { proxy, type } = payload;
        proxy = (proxy || "").trim();
        if (!proxy) return { ok: false, error: "No proxy provided" };

        const scheme = (
          type ||
          proxy.match(/^[a-z0-9]+(?=:\/\/)/i)?.[0] ||
          "http"
        ).toLowerCase();
        const proxyUrl = proxy.includes("://") ? proxy : `${scheme}://${proxy}`;

        const agent: Agent = scheme.startsWith("socks")
          ? (new SocksProxyAgent(proxyUrl) as unknown as Agent)
          : (new HttpsProxyAgent(proxyUrl) as unknown as Agent);

        return await new Promise((resolve) => {
          const req = https.get(
            "https://ipinfo.io/json",
            { agent, timeout: 10000 },
            (res) => {
              let data = "";
              res.on("data", (chunk) => (data += chunk));
              res.on("end", () => {
                try {
                  const json = JSON.parse(data);
                  resolve({
                    ok: true,
                    ip: json.ip,
                    city: json.city,
                    region: json.region,
                    country: json.country,
                    org: json.org,
                  });
                } catch {
                  resolve({ ok: false, error: "Invalid response" });
                }
              });
            }
          );
          req.on("error", (err) => resolve({ ok: false, error: err.message }));
          req.on("timeout", () => resolve({ ok: false, error: "Timeout" }));
        });
      } catch (err: any) {
        return { ok: false, error: err.message };
      }
    }
  );
}
