// Guarda la app en el celular. Nunca descarga nada por su cuenta:
// todo se sirve desde lo guardado, y las actualizaciones bajan solo cuando
// la app lo pide (botón "Buscar actualización").
// revisión 2: baja todo de nuevo una sola vez para arreglar el botón de actualizar.
const CACHE = "rutina";
const FILES = ["./", "index.html", "manifest.webmanifest", "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "fonts/barlow-400.woff2", "fonts/barlow-500.woff2", "fonts/barlow-600.woff2", "fonts/barlow-700.woff2", "fonts/barlow-condensed-600.woff2", "fonts/barlow-condensed-700.woff2", "fonts/barlow-condensed-800.woff2"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: "reload" })))).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const u = new URL(req.url);
  if (u.pathname.endsWith("version.json") || u.searchParams.has("upd")) return; // solo cuando se pide actualizar
  const key = req.mode === "navigate" ? "index.html" : req;
  e.respondWith(caches.match(key, { ignoreSearch: true }).then(hit => hit || fetch(req)));
});
self.addEventListener("message", e => {
  if (!e.data || e.data.type !== "update") return;
  const files = e.data.files || FILES;
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(files.map(f => fetch(f, { cache: "reload" }).then(r => { if (!r.ok) throw new Error(f); return c.put(f === "./" ? "index.html" : f, r); }))))
    .then(() => e.source.postMessage({ type: "updated" }), () => e.source.postMessage({ type: "update-failed" })));
});
