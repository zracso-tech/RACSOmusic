"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileResult = { ok: true } | { ok: false; error: string };

export async function updateProfile(input: {
  display_name: string | null;
  avatar_url: string | null;
}): Promise<ProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: input.display_name,
      avatar_url: input.avatar_url,
    })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/perfil");
  revalidatePath("/");
  return { ok: true };
}
