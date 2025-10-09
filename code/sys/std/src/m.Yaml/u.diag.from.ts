import { type t } from './common.ts';

type D = t.YamlDiagnosticLib;

/**
 * Convert a list of YAML parser errors into normalized diagnostics.
 */
export const fromYamlErrors: D['fromYamlErrors'] = (list) => {
  if (!Array.isArray(list) || list.length === 0) return [];
  return list.map(fromYamlError);
};

/**
 * Convert a single YAML parser error into a normalized diagnostic.
 */
export const fromYamlError: D['fromYamlError'] = (err: t.Yaml.Error) => {
  const code = typeof err.code === 'number' ? String(err.code) : err.code;

  // Pos:
  const pos =
    Array.isArray(err.pos) && err.pos.length >= 1
      ? ([err.pos[0] ?? 0, err.pos[1] ?? err.pos[0] ?? 0] as const)
      : undefined;

  // LinePos:
  const linePos =
    Array.isArray(err.linePos) && err.linePos.length > 0
      ? ((): readonly [t.LinePos] | readonly [t.LinePos, t.LinePos] => {
          const [a, b] = err.linePos as readonly [t.LinePos, t.LinePos?];
          return b ? ([a, b] as const) : ([a] as const);
        })()
      : undefined;

  // Range:
  const range = Array.isArray((err as any).range)
    ? coerceRange((err as any).range as any)
    : undefined;

  // Build once; no post-assign to readonly fields:
  return {
    message: err.message,
    ...(code ? { code } : {}),
    ...(pos ? { pos } : {}),
    ...(linePos ? { linePos } : {}),
    ...(range ? { range } : {}),
  };
};

/**
 * Helpers:
 */
type R = readonly [number, number] | readonly [number, number, number?];
function coerceRange(r: R): t.Yaml.Range {
  return typeof r[2] === 'number'
    ? ([r[0], r[1], r[2] as number] as const)
    : ([r[0], r[1]] as const);
}
