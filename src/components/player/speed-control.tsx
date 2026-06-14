import { Minus, Plus } from "lucide-react";

/** Regulador de velocidad de scroll con botones −/+ (mejor en móvil que una barra). */
export function SpeedControl({
  value,
  onChange,
  min = 10,
  max = 160,
  step = 10,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted">
      <span className="shrink-0">Velocidad</span>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={value <= min}
        aria-label="Más lento"
        className="grid h-8 w-8 place-items-center rounded-lg border border-border text-foreground transition-colors hover:bg-background disabled:opacity-40"
      >
        <Minus size={16} />
      </button>
      <span className="w-7 text-center font-mono text-sm text-foreground tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + step))}
        disabled={value >= max}
        aria-label="Más rápido"
        className="grid h-8 w-8 place-items-center rounded-lg border border-border text-foreground transition-colors hover:bg-background disabled:opacity-40"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
