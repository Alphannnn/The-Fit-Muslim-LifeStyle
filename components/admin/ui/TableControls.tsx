"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/* Search, filtering and paging all live in the URL, so an admin can bookmark
   or share the exact view they are looking at, and the back button works. */

function withParam(
  params: URLSearchParams,
  key: string,
  value: string | null,
): string {
  const next = new URLSearchParams(params);
  if (value === null || value === "") next.delete(key);
  else next.set(key, value);
  /* any filter change puts you back on the first page */
  if (key !== "page") next.delete("page");
  const qs = next.toString();
  return qs ? `?${qs}` : "";
}

export function SearchInput({
  placeholder = "Search…",
  paramName = "q",
}: {
  placeholder?: string;
  paramName?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get(paramName) ?? "");
  const first = useRef(true);

  /* Debounced so typing doesn't fire a request per keystroke. Navigation is an
     external system, so driving it from an effect is the correct shape. */
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const id = window.setTimeout(() => {
      router.replace(`${pathname}${withParam(params, paramName, value.trim() || null)}`, {
        scroll: false,
      });
    }, 300);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative w-full sm:w-72">
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-panel-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="admin-field pl-9"
      />
    </div>
  );
}

export function FilterSelect({
  paramName,
  options,
  label,
  allLabel = "All",
}: {
  paramName: string;
  options: { value: string; label: string }[];
  label: string;
  allLabel?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get(paramName) ?? "";

  return (
    <label className="flex items-center gap-2">
      <span className="sr-only">{label}</span>
      <select
        value={current}
        aria-label={label}
        onChange={(e) =>
          router.replace(`${pathname}${withParam(params, paramName, e.target.value || null)}`, {
            scroll: false,
          })
        }
        className="admin-field w-auto cursor-pointer pr-8"
      >
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** A sortable column header. Clicking cycles ascending → descending. */
export function SortHeader({
  field,
  children,
  align = "left",
}: {
  field: string;
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const activeSort = params.get("sort");
  const activeDir = params.get("dir") === "asc" ? "asc" : "desc";
  const isActive = activeSort === field;
  const nextDir = isActive && activeDir === "desc" ? "asc" : "desc";

  const next = new URLSearchParams(params);
  next.set("sort", field);
  next.set("dir", nextDir);
  next.delete("page");

  return (
    <th
      scope="col"
      className={`border-b border-panel-border px-4 py-2.5 text-[0.7rem] font-semibold uppercase tracking-[0.06em] text-panel-muted ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      <Link
        href={`${pathname}?${next.toString()}`}
        scroll={false}
        className={`inline-flex items-center gap-1 transition-colors hover:text-panel-ink ${
          isActive ? "text-panel-ink" : ""
        }`}
      >
        {children}
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className={`h-3 w-3 transition-transform ${isActive ? "opacity-100" : "opacity-30"} ${
            isActive && activeDir === "asc" ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </th>
  );
}

export function Pagination({
  page,
  pages,
  total,
  label = "records",
}: {
  page: number;
  pages: number;
  total: number;
  label?: string;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  if (pages <= 1) {
    return (
      <p className="px-1 py-3 text-[0.78rem] text-panel-muted">
        {total} {label}
      </p>
    );
  }

  const href = (p: number) => `${pathname}${withParam(params, "page", String(p))}`;

  /* A compact window around the current page rather than every number. */
  const window: number[] = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(pages, page + 2); p++) window.push(p);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 px-1 py-3"
    >
      <p className="text-[0.78rem] text-panel-muted">
        Page {page} of {pages} · {total} {label}
      </p>
      <div className="flex items-center gap-1">
        <Link
          href={href(Math.max(1, page - 1))}
          scroll={false}
          aria-disabled={page === 1}
          className={`rounded-md border border-panel-border-strong px-2.5 py-1.5 text-[0.75rem] transition-colors ${
            page === 1
              ? "pointer-events-none opacity-40"
              : "hover:border-panel-muted hover:bg-panel-raised"
          }`}
        >
          Previous
        </Link>
        {window.map((p) => (
          <Link
            key={p}
            href={href(p)}
            scroll={false}
            aria-current={p === page ? "page" : undefined}
            className={`min-w-8 rounded-md border px-2.5 py-1.5 text-center text-[0.75rem] transition-colors ${
              p === page
                ? "border-green-800 bg-green-800 text-white"
                : "border-panel-border-strong hover:border-panel-muted hover:bg-panel-raised"
            }`}
          >
            {p}
          </Link>
        ))}
        <Link
          href={href(Math.min(pages, page + 1))}
          scroll={false}
          aria-disabled={page === pages}
          className={`rounded-md border border-panel-border-strong px-2.5 py-1.5 text-[0.75rem] transition-colors ${
            page === pages
              ? "pointer-events-none opacity-40"
              : "hover:border-panel-muted hover:bg-panel-raised"
          }`}
        >
          Next
        </Link>
      </div>
    </nav>
  );
}
