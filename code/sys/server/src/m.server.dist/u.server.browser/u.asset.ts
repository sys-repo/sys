import type { t } from './common.ts';

/** Render one canonical Dist asset path as an exact URL pathname. */
export function assetPathname(path: t.Files.String.Path): string {
  const encoded = path.split('/').map((segment) => encodeURIComponent(segment)).join('/');
  return `/${encoded}`;
}

/** Resolve one canonical Dist asset against the exact listener origin. */
export function assetUrl(origin: t.StringUrl, path: t.Files.String.Path): string {
  return new URL(assetPathname(path), `${origin}/`).href;
}
