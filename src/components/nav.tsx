"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Library, Mic, Guitar, LogOut, Music4 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ThemeToggle } from "./theme-toggle";
import { Avatar } from "./avatar";
import { signOut } from "@/app/(app)/actions";

const links = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/biblioteca", label: "Biblioteca", icon: Library },
  { href: "/voz", label: "Voz", icon: Mic },
  { href: "/guitarra", label: "Guitarra", icon: Guitar },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

interface NavUser {
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

/** Sidebar en desktop. */
export function Sidebar({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const name = user.name || user.email?.split("@")[0] || "Mi perfil";
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface p-4 md:flex">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-foreground">
          <Music4 size={18} />
        </div>
        <span className="font-semibold tracking-tight">RACSOmusic</span>
      </div>

      <nav className="flex flex-col gap-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive(pathname, href)
                ? "bg-accent/10 text-accent"
                : "text-muted hover:bg-background hover:text-foreground",
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/perfil"
            className="flex min-w-0 items-center gap-2 rounded-lg px-1 py-1 hover:bg-background"
          >
            <Avatar url={user.avatarUrl} name={name} size={28} />
            <span className="truncate text-sm font-medium">{name}</span>
          </Link>
          <ThemeToggle />
        </div>
        <form action={signOut}>
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-background hover:text-foreground">
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}

/** Barra inferior en móvil. */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-surface/95 backdrop-blur md:hidden">
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
            isActive(pathname, href) ? "text-accent" : "text-muted",
          )}
        >
          <Icon size={20} />
          {label}
        </Link>
      ))}
    </nav>
  );
}

/** Cabecera móvil con logo, tema, avatar y logout. */
export function MobileHeader({ user }: { user: NavUser }) {
  const name = user.name || user.email?.split("@")[0] || "Mi perfil";
  return (
    <header className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
      <div className="flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-accent-foreground">
          <Music4 size={16} />
        </div>
        <span className="font-semibold tracking-tight">RACSOmusic</span>
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Link href="/perfil" aria-label="Mi perfil" className="ml-1">
          <Avatar url={user.avatarUrl} name={name} size={32} />
        </Link>
        <form action={signOut}>
          <button
            aria-label="Cerrar sesión"
            className="grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            <LogOut size={18} />
          </button>
        </form>
      </div>
    </header>
  );
}
