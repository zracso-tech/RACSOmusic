// Service worker mínimo: habilita la instalación como PWA.
// El cacheo offline avanzado (assets, rutas) se afinará en iteraciones posteriores.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {
  // Passthrough por ahora; necesario para que el navegador considere la app instalable.
});
