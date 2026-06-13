"use client";

import { useEffect } from "react";

/** Registra el service worker en producción para habilitar la PWA. */
export function RegisterSW() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // El registro puede fallar en contextos sin HTTPS; no es crítico.
      });
    }
  }, []);
  return null;
}
