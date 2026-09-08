"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { adminLogoutAction } from "@/lib/admin/auth-actions";

export type NavBadges = {
  plans?: number;
  reviews?: number;
  orders?: number;
};

type Item = {
  label: string;
  href: string;
  icon: ReactNode;
  badge?: keyof NavBadges;
  /** hide from anyone who is not a full admin */
  adminOnly?: boolean;
  /** match only the exact path, for index routes */
  exact?: boolean;
};

const icon = (d: string) => (
  <svg viewBox="0 0 24 24" className="h-[1.05rem] w-[1.05rem] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7">
    <path d={d} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const GROUPS: { heading: string; items: Item[] }[] = [
  {
    heading: "",
    items: [
      { label: "Overview", href: "/admin", exact: true, icon: icon("M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6V11h-6v9Zm0-16v5h6V4h-6Z") },
    ],
  },
  {
    heading: "Commerce",
    items: [
      { label: "Orders", href: "/admin/orders", badge: "orders", icon: icon("M6 8h12l-1.2 11.2a1.5 1.5 0 0 1-1.5 1.3H8.7a1.5 1.5 0 0 1-1.5-1.3L6 8Zm3 0a3 3 0 0 1 6 0") },
      { label: "Products", href: "/admin/products", icon: icon("M20 7 12 3 4 7v10l8 4 8-4V7Zm-8 4L4 7m8 4 8-4m-8 4v10") },
      { label: "Customers", href: "/admin/customers", icon: icon("M16 19c0-2.8-2.7-4.5-6-4.5S4 16.2 4 19m6-8a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm10 8c0-2.2-1.5-3.6-3.5-4.2M15 5.3a3.5 3.5 0 0 1 0 6.4") },
      { label: "Subscriptions", href: "/admin/subscriptions", icon: icon("M4 12a8 8 0 0 1 13.7-5.6M20 12a8 8 0 0 1-13.7 5.6M17 3v4h-4M7 21v-4h4") },
    ],
  },
  {
    heading: "Coaching",
    items: [
      { label: "Plan queue", href: "/admin/plans", badge: "plans", icon: icon("M9 5h6M5 8h14v13H5V8Zm4 5h6m-6 4h4") },
    ],
  },
  {
    heading: "Content",
    items: [
      { label: "Journal", href: "/admin/journal", icon: icon("M5 4h11l3 3v13H5V4Zm3 5h8M8 13h8M8 17h5") },
      { label: "Reviews", href: "/admin/reviews", badge: "reviews", icon: icon("m12 4 2.4 5 5.6.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9L9.6 9 12 4Z") },
      { label: "Newsletter", href: "/admin/newsletter", icon: icon("m4 7 8 6 8-6M4 6h16v12H4V6Z") },
    ],
  },
  {
    heading: "Administration",
    items: [
      { label: "Team", href: "/admin/team", adminOnly: true, icon: icon("M12 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 0c-3.9 0-7 2.2-7 5h14c0-2.8-3.1-5-7-5Z") },
      { label: "Activity", href: "/admin/activity", adminOnly: true, icon: icon("M4 12h3l2.5-6 4 12 2.5-6h4") },
    ],
  },
];

export default function AdminShell({
  children,
  user,
  badges,
}: {
  children: ReactNode;
  user: { name: string; email: string; role: string };
  badges: NavBadges;
}) {
  const pathname = usePathname();
  /* Keyed to the route so navigating closes the drawer by derivation. */
  const [drawerFor, setDrawerFor] = useState<string | null>(null);
  const drawerOpen = drawerFor === pathname;

  const isFullAdmin = user.role === "admin";
  const isActive = (item: Item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const rail = (
    <div className="admin-rail flex h-full flex-col bg-rail text-white/70">
      <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" className="h-8 w-8 rounded object-contain" />
        <div className="min-w-0">
          <p className="truncate text-[0.82rem] font-semibold text-white">The Fit Muslim</p>
          <p className="text-[0.64rem] uppercase tracking-[0.14em] text-gold-bright">
            Control Panel
          </p>
        </div>
      </div>

      <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-4">
        {GROUPS.map((group) => {
          const items = group.items.filter((i) => !i.adminOnly || isFullAdmin);
          if (items.length === 0) return null;
          return (
            <div key={group.heading || "root"} className="mb-5 last:mb-0">
              {group.heading && (
                <p className="mb-1.5 px-3 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-white/35">
                  {group.heading}
                </p>
              )}
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active = isActive(item);
                  const count = item.badge ? (badges[item.badge] ?? 0) : 0;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`group flex items-center gap-2.5 rounded-md px-3 py-2 text-[0.83rem] font-medium transition-colors ${
                          active
                            ? "bg-rail-active text-white"
                            : "text-white/65 hover:bg-rail-hover hover:text-white"
                        }`}
                      >
                        <span className={active ? "text-gold-bright" : "text-white/45 group-hover:text-white/80"}>
                          {item.icon}
                        </span>
                        <span className="flex-1 truncate">{item.label}</span>
                        {count > 0 && (
                          <span className="rounded-full bg-gold-bright px-1.5 py-px text-[0.62rem] font-bold text-rail">
                            {count}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold-bright text-[0.7rem] font-bold text-rail">
            {initials || "?"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.78rem] font-medium text-white">{user.name}</p>
            <p className="truncate text-[0.66rem] capitalize text-white/45">{user.role}</p>
          </div>
        </div>
        <form action={adminLogoutAction} className="mt-1">
          <button
            type="submit"
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-[0.78rem] font-medium text-white/60 transition-colors hover:bg-rail-hover hover:text-white"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M15 17l5-5-5-5M20 12H9M12 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Sign out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="admin-scope min-h-screen">
      {/* desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 lg:block">{rail}</aside>

      {/* mobile drawer */}
      {drawerOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerFor(null)}
            className="fixed inset-0 z-40 cursor-default bg-rail/50 backdrop-blur-[2px] lg:hidden"
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 shadow-2xl lg:hidden">{rail}</aside>
        </>
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-panel-border bg-panel-surface/85 px-4 py-3 backdrop-blur-md sm:px-6 lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerFor(drawerOpen ? null : pathname)}
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-md border border-panel-border-strong text-panel-soft transition-colors hover:bg-panel-raised"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>
          <span className="text-[0.85rem] font-semibold text-panel-ink">Control Panel</span>
          <Link
            href="/"
            className="ml-auto text-[0.72rem] font-medium text-panel-muted transition-colors hover:text-green-700"
          >
            View store ↗
          </Link>
        </header>

        {/* desktop utility bar */}
        <div className="sticky top-0 z-30 hidden items-center justify-end gap-4 border-b border-panel-border bg-panel-surface/85 px-8 py-2.5 backdrop-blur-md lg:flex">
          <Link
            href="/"
            target="_blank"
            className="text-[0.75rem] font-medium text-panel-muted transition-colors hover:text-green-700"
          >
            View store ↗
          </Link>
          <span className="h-4 w-px bg-panel-border" />
          <span className="text-[0.75rem] text-panel-muted">{user.email}</span>
        </div>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
