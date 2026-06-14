import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase con la clave de servicio (service_role). SALTA RLS.
 * USAR SOLO EN SERVIDOR. Nunca exponer la clave al cliente.
 * Necesario para copiar archivos entre carpetas de distintos usuarios.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
