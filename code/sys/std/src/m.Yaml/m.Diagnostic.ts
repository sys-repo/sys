import type { t } from './common.ts';

export const Diagnostic: t.YamlDiagnosticLib = {
  fromYamlErrors(list?: t.Yaml.Error[]): t.Yaml.Diagnostic[] {
    if (!Array.isArray(list) || list.length === 0) return [];
    return list.map(Diagnostic.fromYamlError);
  },

  fromYamlError(e: t.Yaml.Error): t.Yaml.Diagnostic {
    const code = typeof e.code === 'number' ? String(e.code) : e.code;

    // Pos:
    const pos =
      Array.isArray(e.pos) && e.pos.length >= 1
        ? ([e.pos[0] ?? 0, e.pos[1] ?? e.pos[0] ?? 0] as const)
        : undefined;

    // LinePos:
    const linePos =
      Array.isArray(e.linePos) && e.linePos.length > 0
        ? ((): readonly [t.LinePos] | readonly [t.LinePos, t.LinePos] => {
            const [a, b] = e.linePos as readonly [t.LinePos, t.LinePos?];
            return b ? ([a, b] as const) : ([a] as const);
          })()
        : undefined;

    // Range:
    const range = Array.isArray((e as any).range)
      ? coerceRange((e as any).range as any)
      : undefined;

    // Build once; no post-assign to readonly fields:
    return {
      message: e.message,
      ...(code ? { code } : {}),
      ...(pos ? { pos } : {}),
      ...(linePos ? { linePos } : {}),
      ...(range ? { range } : {}),
    };
  },
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
