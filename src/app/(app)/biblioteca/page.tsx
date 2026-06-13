import { Library } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/library/empty-state";
import { LibraryView } from "@/components/library/library-view";
import type { Song } from "@/types/database";

export default async function BibliotecaPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("songs")
    .select("*")
    .order("created_at", { ascending: false });

  const songs = (data ?? []) as Song[];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-8">
      {songs.length === 0 ? (
        <>
          <h1 className="mb-6 text-2xl font-semibold tracking-tight">
            Biblioteca
          </h1>
          <EmptyState
            icon={Library}
            title="Tu biblioteca está vacía"
            description="Crea tu primera canción para empezar a practicar voz o guitarra. Backing track, letra y acordes, todo en un sitio."
            ctaHref="/song/new"
            ctaLabel="Crear primera canción"
          />
        </>
      ) : (
        <LibraryView title="Biblioteca" songs={songs} newHref="/song/new" />
      )}
    </div>
  );
}
