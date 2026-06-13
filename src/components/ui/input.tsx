import { cn } from "@/lib/utils/cn";
import { forwardRef } from "react";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-10 w-full rounded-xl border border-border bg-surface px-3.5 text-sm",
      "text-foreground placeholder:text-muted",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
