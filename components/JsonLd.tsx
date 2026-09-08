/**
 * Structured data for search engines. Rendered as a plain script tag — the
 * payload is our own JSON, and `<` is escaped so it can never close the tag.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
