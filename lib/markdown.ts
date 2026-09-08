/* A deliberately small subset of Markdown for journal bodies: headings,
   bold, italic, inline code, links, bullet lists, blockquotes, paragraphs.

   Input is escaped before any markup is generated, so post bodies coming
   from the admin editor can never inject HTML. */

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function inline(text: string): string {
  return (
    escapeHtml(text)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<em>$2</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      /* only http(s) and root-relative links survive */
      .replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g,
        '<a href="$2">$1</a>',
      )
  );
}

export function renderMarkdown(source: string): string {
  const blocks = source.replace(/\r\n/g, "\n").trim().split(/\n{2,}/);
  const html: string[] = [];

  for (const block of blocks) {
    const lines = block.split("\n");

    if (/^###\s/.test(block)) {
      html.push(`<h3>${inline(block.replace(/^###\s*/, ""))}</h3>`);
      continue;
    }
    if (/^##\s/.test(block)) {
      html.push(`<h2>${inline(block.replace(/^##\s*/, ""))}</h2>`);
      continue;
    }
    if (lines.every((l) => /^[-*]\s/.test(l))) {
      const items = lines.map((l) => `<li>${inline(l.replace(/^[-*]\s*/, ""))}</li>`);
      html.push(`<ul>${items.join("")}</ul>`);
      continue;
    }
    if (lines.every((l) => /^>\s?/.test(l))) {
      const body = lines.map((l) => l.replace(/^>\s?/, "")).join(" ");
      html.push(`<blockquote>${inline(body)}</blockquote>`);
      continue;
    }
    html.push(`<p>${inline(lines.join(" "))}</p>`);
  }

  return html.join("\n");
}

/** ~200 words per minute, rounded up, floor of 1. */
export function readingMinutes(source: string): number {
  const words = source.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}
