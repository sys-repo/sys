import { type t, Is } from './common.ts';

/**
 * Helpers:
 */
export function isWrapper(v: unknown): v is t.YamlTreeSourceWrapper {
  return (
    Is.record(v) &&
    (Object.prototype.hasOwnProperty.call(v, '.') ||
      Object.prototype.hasOwnProperty.call(v, 'children'))
  );
}

export function toPathParts(path: t.ObjectPath): string[] {
  return path.map((p) => String(p));
}

export function lastSeg(key: string) {
  const i = key.lastIndexOf('/');
  return i >= 0 ? key.slice(i + 1) : key;
}
