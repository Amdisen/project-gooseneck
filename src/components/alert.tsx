import { Warning, CheckCircle } from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";

/**
 * Inline alert/banner (design.md §4.9). Functional color on the icon + tinted
 * hairline; status is never conveyed by color alone (always an icon).
 */
export function Alert({
  variant = "danger",
  children,
}: {
  variant?: "danger" | "success";
  children: React.ReactNode;
}) {
  const Icon = variant === "success" ? CheckCircle : Warning;
  return (
    <div
      role={variant === "danger" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-md border px-3.5 py-3 text-sm",
        variant === "success"
          ? "border-success/40 bg-success/10 text-success"
          : "border-danger/40 bg-danger/10 text-danger",
      )}
    >
      <Icon size={18} weight="fill" aria-hidden className="mt-0.5 shrink-0" />
      <div className="text-foreground">{children}</div>
    </div>
  );
}
