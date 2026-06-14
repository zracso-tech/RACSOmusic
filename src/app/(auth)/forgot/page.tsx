"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Music4, ArrowLeft, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPasswordReset, type ForgotState } from "./actions";

export default function ForgotPage() {
  const [state, formAction, pending] = useActionState<ForgotState, FormData>(
    requestPasswordReset,
    null,
  );

  const sent = state && "ok" in state && state.ok;

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
            <Music4 size={24} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Recuperar contraseña
          </h1>
          <p className="text-sm text-muted">
            Te enviaremos un enlace para crear una nueva.
          </p>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface p-5 text-center">
            <MailCheck size={28} className="text-accent" />
            <p className="text-sm">
              Si el email existe, te hemos enviado un enlace. Revisa tu bandeja
              (y spam).
            </p>
          </div>
        ) : (
          <form action={formAction} className="flex flex-col gap-3">
            <Input
              type="email"
              name="email"
              placeholder="email@ejemplo.com"
              autoComplete="email"
              required
            />
            {state && "error" in state && (
              <p className="text-sm text-red-500">{state.error}</p>
            )}
            <Button type="submit" size="lg" disabled={pending}>
              {pending ? "Enviando…" : "Enviar enlace"}
            </Button>
          </form>
        )}

        <Link
          href="/login"
          className="mt-6 flex items-center justify-center gap-2 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Volver al inicio de sesión
        </Link>
      </div>
    </main>
  );
}
