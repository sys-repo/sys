import { type t, Is } from './common.ts';

/**
 * Helpers:
 */
export function isWrapper(v: unknown): v is t.YamlTreeSourceWrapper {
  const hasOwnProperty = Object.prototype.hasOwnProperty;
  return (
    Is.record(v) &&
    //
    (hasOwnProperty.call(v, '.') || hasOwnProperty.call(v, 'children'))
  );
}

export function toPathParts(path: t.ObjectPath | string): string[] {
  if (typeof path === 'string') {
    if (path.length === 0) return [];
    const segments = path.split('/');
    if (segments.length === 1 && segments[0] === '') return [];
    return segments;
  }
  return path.map((p) => String(p));
}

export function lastSeg(key: string) {
  const i = key.lastIndexOf('/');
  return i >= 0 ? key.slice(i + 1) : key;
}

export function toSeq(rec: Record<string, t.YamlTreeSourceNode>) {
  return Object.entries(rec).map(([k, v]) => ({ [k]: v }));
}
