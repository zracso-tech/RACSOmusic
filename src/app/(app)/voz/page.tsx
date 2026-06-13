import { Mic } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/library/empty-state";
import { LibraryView } from "@/components/library/library-view";
import type { Song } from "@/types/database";

export default async function VozPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("songs")
    .select("*")
    .eq("module", "voice")
    .order("created_at", { ascending: false });

  const songs = (data ?? []) as Song[];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-8">
      {songs.length === 0 ? (
        <>
          <h1 className="mb-6 text-2xl font-semibold tracking-tight">Voz</h1>
          <EmptyState
            icon={Mic}
            title="Aún no hay canciones de voz"
            description="Añade una canción con su backing track y letra sincronizada para empezar a cantar y grabar tu progreso."
            ctaHref="/song/new?module=voice"
            ctaLabel="Nueva canción de voz"
          />
        </>
      ) : (
        <LibraryView
          title="Voz"
          songs={songs}
          newHref="/song/new?module=voice"
        />
      )}
    </div>
  );
}
