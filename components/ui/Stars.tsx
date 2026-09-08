/**
 * Gold star rating with a fractional last star.
 * `id` must be unique on the page — the gradient stops are referenced by id,
 * so passing a product id or slug keeps several ratings from bleeding together.
 */
export default function Stars({
  value,
  id,
  className = "h-3.5 w-3.5",
}: {
  value: number;
  id: string;
  className?: string;
}) {
  return (
    <span className="flex items-center gap-0.5" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.min(Math.max(value - i, 0), 1) * 100;
        const gradientId = `star-${id}-${i}`;
        return (
          <svg key={i} viewBox="0 0 20 20" className={className}>
            <defs>
              <linearGradient id={gradientId}>
                <stop offset={`${fill}%`} stopColor="var(--color-gold)" />
                <stop offset={`${fill}%`} stopColor="var(--color-linen)" />
              </linearGradient>
            </defs>
            <path
              d="M10 1.6l2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z"
              fill={`url(#${gradientId})`}
            />
          </svg>
        );
      })}
    </span>
  );
}
