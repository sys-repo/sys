import { Path } from './common.ts';

export function resolveFromImportMap(importMapPath: string, value?: string) {
  if (!value) return '';
  if (/^[a-zA-Z][a-zA-Z+.-]*:/.test(value)) return value;
  return new URL(value, Path.toFileUrl(importMapPath).href).href;
}

export function relativeFromImportMap(importMapPath: string, target: string, trailingSlash = false) {
  const dir = Path.dirname(importMapPath);
  let relative = Path.relative(dir, target).replaceAll('\\', '/');
  if (!relative.startsWith('./') && !relative.startsWith('../')) relative = `./${relative}`;
  if (trailingSlash && !relative.endsWith('/')) relative = `${relative}/`;
  return relative;
}
