"use client";

import { useEffect, useState } from "react";
import { Send, X, Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface UserRow {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export function SendSongButton({
  songId,
  senderId,
}: {
  songId: string;
  senderId: string;
}) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setDone(null);
    setError(null);
    setSelected(new Set());
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .neq("id", senderId)
        .order("display_name", { nullsFirst: false });
      setUsers((data ?? []) as UserRow[]);
      setLoading(false);
    })();
  }, [open, senderId]);

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function send() {
    if (selected.size === 0) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/send-song", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          songId,
          recipientIds: Array.from(selected),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "No se pudo enviar.");
      } else {
        setDone(
          `Enviada a ${json.sent} ${json.sent === 1 ? "usuario" : "usuarios"}.`,
        );
      }
    } catch {
      setError("Error de red al enviar.");
    }
    setSending(false);
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Send size={16} />
        Enviar
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-background p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex items-center justify-between">
              <h2 className="font-semibold tracking-tight">Enviar canción</h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="text-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mb-3 text-xs text-muted">
              Se copiará la ficha (letra, acordes, notas) en su perfil, marcada
              como enviada por ti. Las grabaciones no se envían.
            </p>

            {loading ? (
              <p className="py-6 text-center text-sm text-muted">
                Cargando usuarios…
              </p>
            ) : users.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">
                No hay otros usuarios todavía.
              </p>
            ) : (
              <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto">
                {users.map((u) => {
                  const name = u.display_name || "Usuario";
                  const sel = selected.has(u.id);
                  return (
                    <li key={u.id}>
                      <button
                        onClick={() => toggle(u.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors",
                          sel
                            ? "border-accent bg-accent/10"
                            : "border-border hover:bg-surface",
                        )}
                      >
                        <Avatar url={u.avatar_url} name={name} size={32} />
                        <span className="flex-1 truncate text-sm font-medium">
                          {name}
                        </span>
                        {sel && <Check size={18} className="text-accent" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

            {done ? (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-accent">{done}</p>
                <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                  Cerrar
                </Button>
              </div>
            ) : (
              <Button
                onClick={send}
                disabled={sending || selected.size === 0 || users.length === 0}
                className="mt-4 w-full"
              >
                {sending ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Enviando…
                  </>
                ) : (
                  `Enviar${selected.size ? ` (${selected.size})` : ""}`
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
