"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteSong } from "@/app/(app)/song/actions";
import { Button } from "@/components/ui/button";

export function DeleteSongButton({ songId }: { songId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const res = await deleteSong(songId);
    if (res.ok) {
      router.push("/biblioteca");
      router.refresh();
    } else {
      setDeleting(false);
      setConfirming(false);
      alert(`No se pudo borrar: ${res.error}`);
    }
  }

  if (!confirming) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
        <Trash2 size={16} />
        Borrar
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted">¿Seguro?</span>
      <Button
        size="sm"
        className="bg-red-500 text-white"
        onClick={handleDelete}
        disabled={deleting}
      >
        {deleting ? "Borrando…" : "Sí, borrar"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setConfirming(false)}
        disabled={deleting}
      >
        No
      </Button>
    </div>
  );
}
