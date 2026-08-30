// Guarded service worker registration for offline support.
// Never registers in dev, iframe previews, or Lovable preview hosts.

const SW_URL = "/sw.js";

function shouldSkip(): boolean {
  if (!import.meta.env.PROD) return true;
  if (typeof window === "undefined") return true;
  try {
    if (window.top !== window.self) return true;
  } catch {
    return true;
  }
  const h = window.location.hostname;
  if (h.startsWith("id-preview--") || h.startsWith("preview--")) return true;
  if (h === "lovableproject.com" || h.endsWith(".lovableproject.com")) return true;
  if (h === "lovableproject-dev.com" || h.endsWith(".lovableproject-dev.com")) return true;
  if (h === "beta.lovable.dev" || h.endsWith(".beta.lovable.dev")) return true;
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

async function unregisterMatching() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      regs
        .filter((r) => (r.active?.scriptURL || "").endsWith(SW_URL))
        .map((r) => r.unregister())
    );
  } catch { }
}

async function clearStaleCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
  } catch { }
}

export function registerPWA() {
  if (!("serviceWorker" in navigator)) return;
  if (shouldSkip()) {
    void unregisterMatching();
    return;
  }
  window.addEventListener("load", async () => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        const scriptUrl = reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL || "";
        if (scriptUrl && !scriptUrl.endsWith(SW_URL)) {
          await reg.unregister();
          continue;
        }
        if ("update" in reg) {
          await reg.update();
        }
      }
      await clearStaleCaches();
      await navigator.serviceWorker.register(SW_URL, { scope: "/" });
    } catch {
      // Ignore service worker registration failures; the app should still render without the offline cache.
    }
  });
}