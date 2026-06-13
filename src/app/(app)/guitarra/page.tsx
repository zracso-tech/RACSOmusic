import { Guitar } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/library/empty-state";
import { LibraryView } from "@/components/library/library-view";
import type { Song } from "@/types/database";

export default async function GuitarraPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("songs")
    .select("*")
    .eq("module", "guitar")
    .order("created_at", { ascending: false });

  const songs = (data ?? []) as Song[];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-8">
      {songs.length === 0 ? (
        <>
          <h1 className="mb-6 text-2xl font-semibold tracking-tight">
            Guitarra
          </h1>
          <EmptyState
            icon={Guitar}
            title="Aún no hay canciones de guitarra"
            description="Añade una canción con sus acordes (ChordPro) y, si quieres, un backing de YouTube para tocar encima."
            ctaHref="/song/new?module=guitar"
            ctaLabel="Nueva canción de guitarra"
          />
        </>
      ) : (
        <LibraryView
          title="Guitarra"
          songs={songs}
          newHref="/song/new?module=guitar"
        />
      )}
    </div>
  );
}
