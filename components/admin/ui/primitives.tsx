import Link from "next/link";
import type { ReactNode } from "react";

/* Server-safe building blocks shared by every admin screen, so a new page is
   composed rather than restyled from scratch. */

/* ------------------------------------------------------------------ card */

export function Card({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={`rounded-lg border border-panel-border bg-panel-surface shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${
        padded ? "p-5" : ""
      } ${className}`}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-[0.95rem] font-semibold text-panel-ink">{title}</h2>
        {description && (
          <p className="mt-0.5 text-[0.8rem] leading-relaxed text-panel-muted">{description}</p>
        )}
      </div>
      {action}
    </header>
  );
}

/* ----------------------------------------------------------------- badge */

export type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "brand";

const TONES: Record<Tone, string> = {
  neutral: "border-panel-border-strong bg-panel text-panel-soft",
  success: "border-success/30 bg-success-soft text-success",
  warning: "border-warning/30 bg-warning-soft text-warning",
  danger: "border-danger/25 bg-danger-soft text-danger",
  info: "border-info/25 bg-info-soft text-info",
  brand: "border-gold/40 bg-gold/10 text-gold-deep",
};

export function Badge({
  children,
  tone = "neutral",
  dot = false,
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[0.68rem] font-medium capitalize ${TONES[tone]}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/* ---------------------------------------------------------------- button */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-green-800 text-white border border-green-800 hover:bg-green-900 hover:border-green-900 shadow-[0_1px_2px_rgba(16,24,40,0.08)]",
  secondary:
    "bg-panel-surface text-panel-ink border border-panel-border-strong hover:border-panel-muted hover:bg-panel-raised",
  ghost: "bg-transparent text-panel-soft border border-transparent hover:bg-panel-raised hover:text-panel-ink",
  danger: "bg-danger text-white border border-danger hover:brightness-110",
};

const SIZES = {
  sm: "px-2.5 py-1.5 text-[0.75rem] gap-1.5",
  md: "px-3.5 py-2 text-[0.82rem] gap-2",
};

export const buttonClass = (
  variant: ButtonVariant = "secondary",
  size: keyof typeof SIZES = "md",
) =>
  `inline-flex cursor-pointer items-center justify-center rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${VARIANTS[variant]} ${SIZES[size]}`;

export function LinkButton({
  href,
  children,
  variant = "secondary",
  size = "md",
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: keyof typeof SIZES;
}) {
  return (
    <Link href={href} className={buttonClass(variant, size)}>
      {children}
    </Link>
  );
}

/* ----------------------------------------------------------------- table */

export function Table({ children, minWidth = "48rem" }: { children: ReactNode; minWidth?: string }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-panel-border bg-panel-surface">
      <table className="w-full border-collapse text-left text-[0.84rem]" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function Th({
  children,
  align = "left",
  width,
}: {
  children?: ReactNode;
  align?: "left" | "right" | "center";
  width?: string;
}) {
  return (
    <th
      scope="col"
      style={{ width }}
      className={`border-b border-panel-border px-4 py-2.5 text-[0.7rem] font-semibold uppercase tracking-[0.06em] text-panel-muted text-${align}`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = "left",
  className = "",
}: {
  children?: ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  return (
    <td
      className={`border-b border-panel-border/70 px-4 py-3 align-middle text-panel-soft text-${align} ${className}`}
    >
      {children}
    </td>
  );
}

/* ----------------------------------------------------------- empty state */

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-panel-border-strong bg-panel-surface px-6 py-14 text-center">
      {icon && <div className="mb-3 text-panel-muted">{icon}</div>}
      <p className="text-[0.95rem] font-semibold text-panel-ink">{title}</p>
      {description && (
        <p className="mx-auto mt-1.5 max-w-sm text-[0.82rem] leading-relaxed text-panel-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* --------------------------------------------------------- page scaffold */

export function PageHeading({
  title,
  description,
  action,
  breadcrumb,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  breadcrumb?: { label: string; href?: string }[];
}) {
  return (
    <header className="mb-6">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-1.5 text-[0.75rem] text-panel-muted">
          {breadcrumb.map((crumb, i) => (
            <span key={`${crumb.label}-${i}`} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden>/</span>}
              {crumb.href ? (
                <Link href={crumb.href} className="transition-colors hover:text-green-700">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-panel-soft">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.01em] text-panel-ink">{title}</h1>
          {description && (
            <p className="mt-1 max-w-2xl text-[0.85rem] leading-relaxed text-panel-muted">
              {description}
            </p>
          )}
        </div>
        {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
      </div>
    </header>
  );
}

/* Definition row used across the detail drawers. */
export function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-panel-border/70 py-2.5 last:border-0">
      <dt className="shrink-0 text-[0.78rem] text-panel-muted">{label}</dt>
      <dd className="text-right text-[0.84rem] font-medium text-panel-ink">{children}</dd>
    </div>
  );
}
