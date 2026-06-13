"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type RecResult = { ok: true } | { ok: false; error: string };

export async function saveRecording(input: {
  songId: string;
  storage_path: string;
  duration_seconds: number;
  note: string | null;
  has_backing_mix: boolean;
}): Promise<RecResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  const { error } = await supabase.from("recordings").insert({
    song_id: input.songId,
    user_id: user.id,
    storage_path: input.storage_path,
    duration_seconds: input.duration_seconds,
    note: input.note,
    has_backing_mix: input.has_backing_mix,
  });
  if (error) return { ok: false, error: error.message };

  // Marca la canción como practicada (para ordenar por "última práctica").
  await supabase
    .from("songs")
    .update({ last_practiced_at: new Date().toISOString() })
    .eq("id", input.songId);

  revalidatePath(`/song/${input.songId}/record`);
  revalidatePath("/");
  revalidatePath("/biblioteca");
  revalidatePath("/voz");
  revalidatePath("/guitarra");
  return { ok: true };
}

export async function deleteRecording(input: {
  id: string;
  songId: string;
  storage_path: string;
}): Promise<RecResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  await supabase.storage.from("recordings").remove([input.storage_path]);

  const { error } = await supabase
    .from("recordings")
    .delete()
    .eq("id", input.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/song/${input.songId}/record`);
  return { ok: true };
}
