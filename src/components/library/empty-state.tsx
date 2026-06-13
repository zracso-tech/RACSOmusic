import Link from "next/link";
import { Plus, type LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="grid place-items-center py-24 text-center">
      <div className="flex max-w-sm flex-col items-center gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-2xl border border-border bg-surface text-muted">
          <Icon size={26} />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted">{description}</p>
        </div>
        <Link
          href={ctaHref}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          <Plus size={18} />
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}
