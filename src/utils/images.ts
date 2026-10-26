// Image helpers shared by the admin product form and bulk import/export.

// Normalize product images into a clean array of unique URLs.
// Accepts a real array (JSON), a string with several URLs separated by commas,
// pipes or newlines (CSV/Excel or pasted input), or a mix of both. Commas that
// are part of a URL's query string (e.g. "?w=500,h=500") survive the split.
export function parseImageList(value: unknown): string[] {
  if (value === undefined || value === null || value === '') return [];
  const rawParts = (Array.isArray(value) ? value.flat(Infinity) : [value]).flatMap((v) =>
    v === undefined || v === null ? [] : String(v).split(/[,|\n]/)
  );
  const urls: string[] = [];
  rawParts.forEach((part) => {
    const t = part.trim();
    if (!t) return;
    // A fragment that doesn't start a new URL is a leftover from a comma
    // inside the previous URL — glue it back on.
    if (urls.length && !/^(https?:\/\/|\/|data:)/i.test(t)) {
      urls[urls.length - 1] += ',' + t;
    } else {
      urls.push(t);
    }
  });
  return [...new Set(urls)];
}
