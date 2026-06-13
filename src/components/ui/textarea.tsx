import { cn } from "@/lib/utils/cn";
import { forwardRef } from "react";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm",
      "text-foreground placeholder:text-muted",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
      "resize-y min-h-24 font-mono leading-relaxed",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
