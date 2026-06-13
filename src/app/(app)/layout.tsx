import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar, BottomNav, MobileHeader } from "@/components/nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Doble cinturón: el middleware ya protege, pero validamos en el servidor.
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .single();

  const navUser = {
    email: user.email ?? null,
    name: profile?.display_name ?? null,
    avatarUrl: profile?.avatar_url ?? null,
  };

  return (
    <div className="flex min-h-dvh">
      <Sidebar user={navUser} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader user={navUser} />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
