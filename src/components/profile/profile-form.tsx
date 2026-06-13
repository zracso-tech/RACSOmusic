"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, Copy, Loader2, Share2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/app/(app)/perfil/actions";
import { useTheme } from "@/components/theme-provider";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

export function ProfileForm({
  email,
  displayName,
  avatarUrl,
}: {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState(displayName ?? "");
  const [avatar, setAvatar] = useState<string | null>(avatarUrl);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  const [copied, setCopied] = useState(false);

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setProfileMsg(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesión no válida.");

      const ext = sanitize(file.name.split(".").pop() ?? "jpg");
      const path = `${user.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`; // cache-bust
      setAvatar(url);
    } catch (err) {
      setProfileMsg(
        err instanceof Error ? err.message : "No se pudo subir la foto.",
      );
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function saveProfile() {
    setSavingProfile(true);
    setProfileMsg(null);
    const res = await updateProfile({
      display_name: name.trim() || null,
      avatar_url: avatar,
    });
    setSavingProfile(false);
    if (res.ok) {
      setProfileMsg("Guardado.");
      router.refresh();
    } else {
      setProfileMsg(res.error);
    }
  }

  async function changePassword() {
    setPwdMsg(null);
    if (pwd.length < 6)
      return setPwdMsg({ ok: false, text: "Mínimo 6 caracteres." });
    if (pwd !== pwd2)
      return setPwdMsg({ ok: false, text: "Las contraseñas no coinciden." });

    setSavingPwd(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setSavingPwd(false);
    if (error) setPwdMsg({ ok: false, text: error.message });
    else {
      setPwd("");
      setPwd2("");
      setPwdMsg({ ok: true, text: "Contraseña actualizada." });
    }
  }

  async function invite() {
    const url = window.location.origin;
    const text = "Únete a RACSOmusic 🎵";
    if (navigator.share) {
      try {
        await navigator.share({ title: "RACSOmusic", text, url });
        return;
      } catch {
        /* cancelado: caemos a copiar */
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const themes = [
    { key: "light", label: "Claro" },
    { key: "dark", label: "Oscuro" },
    { key: "system", label: "Sistema" },
  ] as const;

  return (
    <div className="flex flex-col gap-8">
      {/* Foto + nombre */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar url={avatar} name={name || email} size={72} />
            <label className="absolute -bottom-1 -right-1 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-accent text-accent-foreground shadow">
              {uploadingAvatar ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Camera size={16} />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={onPickAvatar}
                className="hidden"
                disabled={uploadingAvatar}
              />
            </label>
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{name || "Sin nombre"}</p>
            <p className="truncate text-sm text-muted">{email}</p>
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Nombre</span>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <div className="flex items-center gap-3">
          <Button onClick={saveProfile} disabled={savingProfile}>
            {savingProfile ? "Guardando…" : "Guardar perfil"}
          </Button>
          {profileMsg && (
            <span className="text-sm text-muted">{profileMsg}</span>
          )}
        </div>
      </section>

      {/* Tema */}
      <section className="flex flex-col gap-3 border-t border-border pt-6">
        <span className="text-sm font-medium">Apariencia</span>
        <div className="flex gap-2">
          {themes.map((t) => (
            <button
              key={t.key}
              onClick={() => setTheme(t.key)}
              className={cn(
                "flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
                theme === t.key
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-muted hover:bg-surface",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* Contraseña */}
      <section className="flex flex-col gap-3 border-t border-border pt-6">
        <span className="text-sm font-medium">Cambiar contraseña</span>
        <Input
          type="password"
          placeholder="Nueva contraseña"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          autoComplete="new-password"
        />
        <Input
          type="password"
          placeholder="Repite la contraseña"
          value={pwd2}
          onChange={(e) => setPwd2(e.target.value)}
          autoComplete="new-password"
        />
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={changePassword}
            disabled={savingPwd}
          >
            {savingPwd ? "Actualizando…" : "Actualizar contraseña"}
          </Button>
          {pwdMsg && (
            <span
              className={cn(
                "text-sm",
                pwdMsg.ok ? "text-accent" : "text-red-500",
              )}
            >
              {pwdMsg.text}
            </span>
          )}
        </div>
      </section>

      {/* Invitar */}
      <section className="flex flex-col gap-3 border-t border-border pt-6">
        <span className="text-sm font-medium">Invitar amigos</span>
        <p className="text-sm text-muted">
          Comparte el enlace de la app para que se registren con su propia
          cuenta.
        </p>
        <Button variant="outline" onClick={invite} className="self-start">
          {copied ? (
            <>
              <Check size={18} /> Enlace copiado
            </>
          ) : (
            <>
              {typeof navigator !== "undefined" && "share" in navigator ? (
                <Share2 size={18} />
              ) : (
                <Copy size={18} />
              )}
              Compartir invitación
            </>
          )}
        </Button>
      </section>
    </div>
  );
}
