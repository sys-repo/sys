import { type t, Fs, slug, Time } from '../common.ts';

const META_RE = /<meta\s+name=["']x-build-reset["'][^>]*>/i;
const META_LINE_RE = /\n?[ \t]*<meta\s+name=["']x-build-reset["'][^>]*>\s*\n?/i;
const HEAD_OPEN_RE = /<head[^>]*>/i;

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
  const cleaned = META_LINE_RE.test(html) ? html.replace(META_LINE_RE, '\n') : html;
  if (HEAD_OPEN_RE.test(cleaned)) {
    return cleaned.replace(HEAD_OPEN_RE, (head) => `${head}\n${meta}`);
  }
  if (META_RE.test(cleaned)) return cleaned.replace(META_RE, meta);
  if (cleaned.includes('</head>')) return cleaned.replace('</head>', `${meta}\n  </head>`);
  return `${meta}\n${cleaned}`;
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
