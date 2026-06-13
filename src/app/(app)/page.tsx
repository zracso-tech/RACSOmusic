import Link from "next/link";
import { Mic, Guitar, Library } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";
import { APP_VERSION } from "@/lib/version";
import type { Profile } from "@/types/database";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profileData } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user!.id)
    .single();
  const profile = (profileData ?? null) as Pick<
    Profile,
    "display_name" | "avatar_url"
  > | null;

  // Conteos para los accesos rápidos.
  const [{ count: voiceCount }, { count: guitarCount }, { count: totalCount }] =
    await Promise.all([
      supabase
        .from("songs")
        .select("id", { count: "exact", head: true })
        .eq("module", "voice"),
      supabase
        .from("songs")
        .select("id", { count: "exact", head: true })
        .eq("module", "guitar"),
      supabase.from("songs").select("id", { count: "exact", head: true }),
    ]);

  const name = profile?.display_name || user?.email?.split("@")[0] || "";

  const cards = [
    { href: "/voz", label: "Voz", icon: Mic, count: voiceCount ?? 0 },
    { href: "/guitarra", label: "Guitarra", icon: Guitar, count: guitarCount ?? 0 },
    { href: "/biblioteca", label: "Biblioteca", icon: Library, count: totalCount ?? 0 },
  ];

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col md:min-h-dvh">
      {/* Portada */}
      <section
        className="relative flex h-72 items-end overflow-hidden bg-accent/20 md:h-96"
        style={{
          backgroundImage:
            "linear-gradient(to top, rgba(0,0,0,0.78), rgba(0,0,0,0.15)), url('/cover.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Avatar del usuario, enlaza a su ficha */}
        <Link href="/perfil" className="absolute right-4 top-4">
          <Avatar
            url={profile?.avatar_url}
            name={name}
            size={44}
            className="ring-2 ring-white/70"
          />
        </Link>

        <div className="relative w-full p-6 text-white md:p-10">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            RACSOmusic
          </h1>
          <p className="mt-1 text-white/80">
            {name ? `Hola, ${name}.` : ""} Tu estudio personal de voz y guitarra.
          </p>
        </div>
      </section>

      {/* Accesos rápidos */}
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-8 md:py-8">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {cards.map(({ href, label, icon: Icon, count }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-accent/50"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent/10 text-accent">
                <Icon size={22} />
              </div>
              <div>
                <p className="font-medium">{label}</p>
                <p className="text-sm text-muted">
                  {count} {count === 1 ? "canción" : "canciones"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Release */}
      <footer className="pb-6 text-center text-xs text-muted">
        RACSOmusic · v{APP_VERSION}
      </footer>
    </div>
  );
}
