import type { Product } from "@/lib/db/schema";

const SHIELD = (
  <path
    d="M12 3l3 2h4v4l2 3-2 3v4h-4l-3 2-3-2H5v-4l-2-3 2-3V5h4l3-2Z"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinejoin="round"
  />
);

/** Compact pill for cards. Renders nothing when halal status is irrelevant. */
export function HalalPill({ product }: { product: Product }) {
  if (product.halalStatus === "not-applicable") return null;
  const certified = product.halalStatus === "certified";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.14em] ${
        certified
          ? "border-green-500/40 bg-green-800/8 text-green-700"
          : "border-gold/45 bg-gold/8 text-gold-deep"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-3 w-3">
        {SHIELD}
      </svg>
      {certified ? "Halal Certified" : "Ingredients Verified"}
    </span>
  );
}

/**
 * Full transparency panel for the product page: who certified it, the
 * certificate reference, every ingredient, and the allergens.
 */
export default function HalalBadge({ product }: { product: Product }) {
  if (product.halalStatus === "not-applicable" && product.ingredients.length === 0) return null;

  const certified = product.halalStatus === "certified";

  return (
    <section className="rounded-lg border border-linen bg-sand p-6">
      <header className="flex items-start gap-3">
        <span
          className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border ${
            certified ? "border-green-500/40 text-green-700" : "border-gold/45 text-gold-deep"
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5">
            {SHIELD}
          </svg>
        </span>
        <div>
          <h3 className="font-display text-sm font-semibold tracking-[0.14em] text-ink uppercase">
            {certified ? "Halal Certified" : "Ingredients Verified"}
          </h3>
          {product.halalAuthority ? (
            <p className="mt-1 text-[0.78rem] text-ink-soft">
              Certified by {product.halalAuthority}
              {product.halalCertRef && (
                <>
                  {" · "}
                  <span className="font-mono text-[0.72rem] text-ink-muted">
                    {product.halalCertRef}
                  </span>
                </>
              )}
            </p>
          ) : (
            <p className="mt-1 text-[0.78rem] text-ink-soft">
              Every ingredient is listed in full below — no proprietary blends.
            </p>
          )}
        </div>
      </header>

      {product.ingredients.length > 0 && (
        <div className="mt-5 border-t border-linen pt-4">
          <h4 className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-ink-muted">
            Every ingredient
          </h4>
          <ul className="mt-2.5 space-y-1.5">
            {product.ingredients.map((ing) => (
              <li key={ing} className="flex gap-2.5 font-serif text-[0.95rem] text-ink-soft">
                <span className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-gold" />
                {ing}
              </li>
            ))}
          </ul>
        </div>
      )}

      {product.allergens.length > 0 && (
        <div className="mt-5 border-t border-linen pt-4">
          <h4 className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-ink-muted">
            Allergens
          </h4>
          <p className="mt-2 font-serif text-[0.95rem] text-ink-soft">
            {product.allergens.join(" · ")}
          </p>
        </div>
      )}
    </section>
  );
}
