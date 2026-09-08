import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { logoutAction } from "@/lib/auth/actions";

const LINKS = [
  { label: "Overview", href: "/account" },
  { label: "Your Plans", href: "/account/plans" },
  { label: "Progress", href: "/account/progress" },
  { label: "Orders", href: "/account/orders" },
  { label: "Downloads", href: "/account/downloads" },
  { label: "Settings", href: "/account/settings" },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  /* Every /account page is guarded here rather than in middleware, which would
     need an edge-compatible database driver. */
  if (!user) redirect("/login?next=/account");

  return (
    <div className="px-6 pt-28 pb-24 md:pt-36">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-linen pb-8">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.3em] text-gold-deep">
            Your Account
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
              As-salāmu ʿalaykum,{" "}
              <span className="text-gold-gradient">{user.name.split(" ")[0]}</span>
            </h1>
            {/* No staff link here on purpose. The control panel is reached only
                by going directly to /admin — it is never advertised anywhere on
                the storefront, and a customer session grants no access to it. */}
            <div className="flex items-center gap-3">
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="cursor-pointer rounded-sm border border-linen px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-ink-soft transition-colors hover:border-gold hover:text-green-800"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </header>

        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          <nav aria-label="Account" className="lg:col-span-3">
            <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
              {LINKS.map((link) => (
                <li key={link.href} className="shrink-0">
                  <Link
                    href={link.href}
                    className="block whitespace-nowrap rounded-sm border border-linen px-4 py-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ink-soft transition-colors hover:border-gold hover:text-green-800 lg:border-0 lg:border-l-2 lg:border-l-linen lg:hover:border-l-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-9">{children}</div>
        </div>
      </div>
    </div>
  );
}
