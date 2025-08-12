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

export function toSeq(rec: Record<string, t.YamlTreeSourceNode>) {
  return Object.entries(rec).map(([k, v]) => ({ [k]: v }));
}

/**
 * Path encoding:
 */


const encodeSeg = (s: string) => s.replace(/~/g, '~0').replace(/\//g, '~1');
const decodeSeg = (s: string) => s.replace(/~1/g, '/').replace(/~0/g, '~');

export const encodePath = (p: t.ObjectPath): string => p.map((s) => encodeSeg(String(s))).join('/');
export function decodePath(k: string): t.ObjectPath {
  return (k === '' ? [] : k.split('/').map(decodeSeg)) as t.ObjectPath;
}
