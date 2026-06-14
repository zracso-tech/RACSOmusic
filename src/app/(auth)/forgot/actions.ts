"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type ForgotState = { ok: boolean } | { error: string } | null;

export async function requestPasswordReset(
  _prev: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Escribe tu email." };

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // Tras verificar, Supabase manda aquí con un code que canjeamos por sesión
    // de recuperación y aterrizamos en /auth/reset para fijar la contraseña.
    redirectTo: `${origin}/auth/callback?next=/auth/reset`,
  });

  if (error) return { error: error.message };
  return { ok: true };
}
