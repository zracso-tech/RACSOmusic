import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// La transcripción de una canción puede tardar unos segundos.
export const maxDuration = 60;

interface GroqSegment {
  start: number;
  end: number;
  text: string;
}

/**
 * Recibe la URL (firmada) de un audio en Storage, descarga el audio en el
 * servidor y lo manda a Groq Whisper para transcribir con marcas de tiempo.
 * Así el móvil solo sube el audio: el trabajo pesado lo hace Groq.
 */
export async function POST(req: Request) {
  // Exigir sesión (evita uso anónimo del endpoint).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta GROQ_API_KEY en el servidor." },
      { status: 500 },
    );
  }

  let url: string;
  let filename = "audio.mp3";
  try {
    const body = await req.json();
    url = body.url;
    if (body.filename) filename = String(body.filename);
  } catch {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 });
  }
  if (!url) {
    return NextResponse.json({ error: "Falta la URL del audio." }, { status: 400 });
  }

  // Descargar el audio (servidor → Storage; no pasa por el límite de body).
  const audioRes = await fetch(url);
  if (!audioRes.ok) {
    return NextResponse.json(
      { error: "No se pudo leer el audio." },
      { status: 400 },
    );
  }
  const audioBlob = await audioRes.blob();

  // Enviar a Groq (API compatible con OpenAI).
  const form = new FormData();
  form.append("file", audioBlob, filename);
  form.append("model", "whisper-large-v3-turbo");
  form.append("response_format", "verbose_json");

  const groqRes = await fetch(
    "https://api.groq.com/openai/v1/audio/transcriptions",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    },
  );

  if (!groqRes.ok) {
    const detail = await groqRes.text();
    return NextResponse.json(
      { error: `Groq devolvió un error (${groqRes.status}).`, detail },
      { status: 502 },
    );
  }

  const data = (await groqRes.json()) as {
    segments?: GroqSegment[];
    text?: string;
  };

  const segments = (data.segments ?? []).map((s) => ({
    start: s.start,
    text: s.text,
  }));

  return NextResponse.json({ segments, text: data.text ?? "" });
}
