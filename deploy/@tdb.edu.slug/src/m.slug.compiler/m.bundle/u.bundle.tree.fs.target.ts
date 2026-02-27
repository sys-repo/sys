import { type t, Fs } from './common.ts';

export function toDocid(input?: t.StringId): t.StringId | undefined {
  const value = String(input ?? '').trim();
  return value ? (value as t.StringId) : undefined;
}

export function normalizeTargets(input?: t.StringPath | readonly t.StringPath[]): t.StringPath[] {
  if (!input) return [];
  const list = Array.isArray(input) ? input : [input];
  return list.map((value) => String(value).trim()).filter(Boolean) as t.StringPath[];
}

export function normalizeTargetDirs(
  input?: t.StringPath | t.SlugBundleFileTreeTargetDir | readonly t.SlugBundleFileTreeTargetDir[],
): t.SlugBundleFileTreeTargetDir[] {
  if (!input) return [];
  if (typeof input === 'string') return [{ kind: 'source', path: input }];
  if (Array.isArray(input)) return input.filter(Boolean) as t.SlugBundleFileTreeTargetDir[];
  return [input as t.SlugBundleFileTreeTargetDir];
}

export function deriveAssetsPath(path: t.StringFile): t.StringFile | undefined {
  const ext = Fs.extname(path).toLowerCase();
  if (ext !== '.json') return;
  const dir = Fs.dirname(path);
  const base = Fs.basename(path, ext);
  return Fs.join(dir, `${base}.assets${ext}`) as t.StringFile;
}
