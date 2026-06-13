# MusicApp 🎵

Aplicación personal de práctica musical (voz + guitarra). PWA instalable, con
autenticación, biblioteca de canciones, reproducción sincronizada y grabación.

## Stack

- **Next.js 15** (App Router) + TypeScript
- **Supabase** — Auth (email/password + Google), Postgres, Storage
- **Tailwind CSS v4** con tokens de tema (dark/light)
- **Lucide** para iconos
- PWA instalable (manifest + service worker)

## Puesta en marcha

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear proyecto en Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Copia `.env.local.example` a `.env.local` y rellena `NEXT_PUBLIC_SUPABASE_URL`
   y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API).
3. Aplica el esquema: abre el **SQL Editor** del dashboard y ejecuta el
   contenido de [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
   Crea tablas, RLS, triggers y los buckets de Storage.

### 3. Activar Google OAuth (opcional)

En Supabase → Authentication → Providers → Google: añade el Client ID/Secret de
Google Cloud. En "Redirect URLs" añade `http://localhost:3000/auth/callback` y
la URL de producción.

### 4. Arrancar

```bash
npm run dev
```

Abre http://localhost:3000 → te redirige a `/login`. Regístrate y entrarás a la
biblioteca vacía.

## Estado actual — Iteración 0 (scaffolding)

✅ Auth (email/password + Google) con sesión protegida por middleware
✅ Navegación entre módulos: Biblioteca · Voz · Guitarra
✅ Tema claro/oscuro con toggle, sin flash
✅ Biblioteca vacía operativa (consulta real a Supabase, aislada por usuario)
✅ Esquema de BD completo con RLS y Storage
✅ PWA instalable

## Próximas iteraciones

1. **CRUD de canciones** — formulario, subida de backing track, búsqueda y filtros
2. **Reproducción** — player de audio/YouTube, autoscroll de letra (LRC), ChordPro, modo performance
3. **Grabación** — micro + mezcla con backing subido, histórico por canción
4. **Pulido** — diagramas de acordes SVG, offline robusto, métricas de evolución

> **Nota sobre grabación con YouTube:** el audio de un embed de YouTube **no**
> puede capturarse desde el navegador (barrera de seguridad cross-origin + ToS).
> La grabación mezclada (backing + voz/guitarra) requiere un backing **subido
> como archivo**. YouTube sirve para reproducir y tocar encima, no como fuente
> de grabación en móvil.

## Iconos PWA

Los iconos actuales son SVG (`public/icons/`). Para máxima compatibilidad
(especialmente iOS), sustitúyelos/añade PNG de 192×192 y 512×512.
