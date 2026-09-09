import { MediaType, Path, type t } from './common.ts';

export function deriveAssetsPath(path: t.StringPath): t.StringFile | undefined {
  const ext = Path.extname(path).toLowerCase();
  if (ext !== '.json') return;
  const dir = Path.dirname(path);
  const base = Path.basename(path, ext);
  return Path.join(dir, `${base}.assets${ext}`) as t.StringFile;
}

export function normalizeFilePath(path: t.StringPath): t.StringPath {
  const raw = String(path).trim().replaceAll('\\', '/');
  return (raw.startsWith('./') ? raw.slice(2) : raw) as t.StringPath;
}

export function mediaTypeFromPath(path: t.StringPath): t.StringMimeType {
  return MediaType.fromPath(path) ?? MediaType.Fallback.binary;
}
