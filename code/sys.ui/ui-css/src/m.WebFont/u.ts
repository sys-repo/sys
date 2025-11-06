import type { t } from './common.ts';

export function buildSources(args: {
  local: readonly string[];
  url: string;
  format: 'woff2' | 'woff';
}) {
  const parts: string[] = [];
  for (const name of args.local) parts.push(`local(${quoteIfNeeded(name)})`);
  parts.push(`url(${quoteIfNeeded(args.url)}) format("${args.format}")`);
  return parts.join(', ');
}

export function inferFormatFromUrl(url: string): 'woff2' | 'woff' | undefined {
  const m = url.toLowerCase().match(/\.(woff2|woff)(?:[?#]|$)/);
  return m ? (m[1] as 'woff2' | 'woff') : undefined;
}

export function fontFaceBlock(args: {
  family: string;
  display: t.WebFontConfig['display'];
  weight: string; // '400' or '100 900'
  style: 'normal' | 'italic';
  sources: string;
}) {
  const { family, display, weight, style, sources } = args;
  const lines: string[] = [];
  lines.push('@font-face {');
  lines.push(`  font-family: ${quoteIfNeeded(family)};`);
  lines.push(`  font-style: ${style};`);
  lines.push(`  font-weight: ${weight};`);
  lines.push(`  font-display: ${display ?? 'swap'};`);
  lines.push(`  src: ${sources};`);
  lines.push('}');
  return lines.join('\n');
}

export function defaultFileForStatic(p: {
  family: string;
  weight: t.FontWeight;
  italic: boolean;
  dir: string;
}) {
  return `${sanitizeDir(p.dir)}/${p.family}-${p.weight}${p.italic ? 'Italic' : ''}.woff2`;
}

export function defaultFileForVariable(p: { family: string; italic: boolean; dir: string }) {
  return `${sanitizeDir(p.dir)}/${p.family}-Var${p.italic ? 'Italic' : ''}.woff2`;
}

export function sanitizeDir(dir: string) {
  return (dir || '').replace(/\/+$/g, '');
}

export function quoteIfNeeded(s: string) {
  return /[\s"']/g.test(s) ? `"${s}"` : s;
}

export function slugify(s: string) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
