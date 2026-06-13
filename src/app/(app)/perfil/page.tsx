import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile/profile-form";
import type { Profile } from "@/types/database";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();
  const profile = (data ?? null) as Profile | null;

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-6 md:px-8 md:py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Volver
      </Link>

      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Mi perfil</h1>

      <ProfileForm
        email={user?.email ?? ""}
        displayName={profile?.display_name ?? null}
        avatarUrl={profile?.avatar_url ?? null}
      />
    </div>
  );
}
