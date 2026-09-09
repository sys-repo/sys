import type { t } from './common.ts';

/** Decode one request URL pathname exactly once into a Files-visible path. */
export function requestPath(request: Request): t.Files.String.Path | undefined {
  try {
    const pathname = new URL(request.url).pathname;
    if (pathname.includes('\\') || pathname.includes('\0')) return;
    if (pathname === '/') return 'index.html' as t.Files.String.Path;
    if (!pathname.startsWith('/')) return;

    const encoded = pathname.slice(1).split('/');
    if (encoded.length === 0 || encoded.some((segment) => segment.length === 0)) return;

    const decoded: string[] = [];
    for (const segment of encoded) {
      const value = decodeURIComponent(segment);
      if (
        value.length === 0 ||
        value === '.' ||
        value === '..' ||
        value.includes('\0') ||
        value.includes('/') ||
        value.includes('\\')
      ) {
        return;
      }
      decoded.push(value);
    }

    return decoded.join('/') as t.Files.String.Path;
  } catch {
    return;
  }
}
