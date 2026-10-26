// Product images are hosted on Cloudinary. Asking for a resized, auto-format
// (WebP/AVIF) copy cuts each image to roughly a third of its original weight.

const UPLOAD_MARKER = '/image/upload/';

/** Resized Cloudinary URL for `url` at `width` px. Non-Cloudinary URLs pass through unchanged. */
export function img(url: string | undefined | null, width: number): string {
  if (!url) return '';
  const at = url.indexOf(UPLOAD_MARKER);
  if (at === -1 || !url.includes('res.cloudinary.com')) return url;

  const head = url.slice(0, at + UPLOAD_MARKER.length);
  const rest = url.slice(at + UPLOAD_MARKER.length);
  // Leave URLs that already carry a transformation (e.g. "w_500/..." or "f_auto,q_auto/...") alone.
  if (/^[a-z]{1,3}_[^/]*\//.test(rest)) return url;

  return `${head}f_auto,q_auto,c_limit,w_${width}/${rest}`;
}

/** `srcSet` string for responsive <img> tags. */
export function imgSet(url: string | undefined | null, widths: number[]): string | undefined {
  if (!url || !url.includes('res.cloudinary.com')) return undefined;
  return widths.map((w) => `${img(url, w)} ${w}w`).join(', ');
}
