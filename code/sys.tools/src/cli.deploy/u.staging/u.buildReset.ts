import { type t, Fs, slug, Time } from '../common.ts';

const META_RE = /<meta\s+name=["']x-build-reset["'][^>]*>/i;

/**
 * Create one cache-busting token for a staging run.
 * Format: YYYYMMDD-abc12
 */
export function createBuildResetToken(now = Time.now.timestamp): string {
  const day = Time.utc(new Date(now)).format('yyyyMMdd');
  return `${day}-${slug().slice(0, 5)}`;
}

/**
 * Insert or replace the x-build-reset meta tag in an HTML document.
 */
export function withBuildResetMeta(html: string, token: string): string {
  const meta = `    <meta name="x-build-reset" content="${token}" />`;
  if (META_RE.test(html)) return html.replace(META_RE, meta);
  if (html.includes('</head>')) return html.replace('</head>', `${meta}\n  </head>`);
  return `${meta}\n${html}`;
}

/**
 * Ensure a staged index.html file carries the x-build-reset meta tag.
 */
export async function ensureBuildResetMeta(path: t.StringPath, token?: string): Promise<void> {
  const value = String(token ?? '').trim();
  if (!value) return;
  const res = await Fs.readText(path);
  if (!res.exists || !res.data) return;
  const next = withBuildResetMeta(res.data, value);
  if (next === res.data) return;
  await Fs.write(path, next);
}
