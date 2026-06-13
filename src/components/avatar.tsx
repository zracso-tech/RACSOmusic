import { cn } from "@/lib/utils/cn";

/** Avatar de usuario: foto si la hay, o inicial como fallback. */
export function Avatar({
  url,
  name,
  size = 40,
  className,
}: {
  url?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const initial = (name?.trim()?.[0] ?? "?").toUpperCase();
  const style = { width: size, height: size };

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        style={style}
        className={cn("shrink-0 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <div
      style={style}
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-accent/15 font-semibold text-accent",
        className,
      )}
    >
      {initial}
    </div>
  );
}
