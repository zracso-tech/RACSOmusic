"use client";

import { useActionState, useState } from "react";
import { Music4 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  signInWithPassword,
  signUpWithPassword,
  type AuthState,
} from "./actions";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const action = mode === "signin" ? signInWithPassword : signUpWithPassword;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    null,
  );

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
            <Music4 size={24} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">RACSOmusic</h1>
          <p className="text-sm text-muted">
            Tu estudio personal de voz y guitarra.
          </p>
        </div>

        <form action={formAction} className="flex flex-col gap-3">
          <Input
            type="email"
            name="email"
            placeholder="email@ejemplo.com"
            autoComplete="email"
            required
          />
          <Input
            type="password"
            name="password"
            placeholder="Contraseña"
            autoComplete={
              mode === "signin" ? "current-password" : "new-password"
            }
            required
            minLength={6}
          />

          {state?.error && (
            <p className="text-sm text-red-500">{state.error}</p>
          )}

          <Button type="submit" size="lg" disabled={pending}>
            {pending
              ? "Un momento…"
              : mode === "signin"
                ? "Entrar"
                : "Crear cuenta"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          {mode === "signin" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="font-medium text-accent hover:underline"
          >
            {mode === "signin" ? "Regístrate" : "Inicia sesión"}
          </button>
        </p>
      </div>
    </main>
  );
}
