"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Music4 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (pwd.length < 6) return setError("Mínimo 6 caracteres.");
    if (pwd !== pwd2) return setError("Las contraseñas no coinciden.");

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setSaving(false);

    if (error) {
      setError(
        error.message.includes("session")
          ? "El enlace ha caducado. Pide uno nuevo."
          : error.message,
      );
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
            <Music4 size={24} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Nueva contraseña
          </h1>
          <p className="text-sm text-muted">Elige una contraseña nueva.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            type="password"
            placeholder="Nueva contraseña"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            autoComplete="new-password"
            required
            minLength={6}
          />
          <Input
            type="password"
            placeholder="Repite la contraseña"
            value={pwd2}
            onChange={(e) => setPwd2(e.target.value)}
            autoComplete="new-password"
            required
            minLength={6}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? "Guardando…" : "Guardar contraseña"}
          </Button>
        </form>
      </div>
    </main>
  );
}
