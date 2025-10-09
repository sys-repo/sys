import { type t } from './common.ts';

type D = t.YamlDiagnosticLib;

/**
 * Convert a list of normalized diagnostics back into mutable YAML parser errors.
 */
export const toYamlErrors: D['toYamlErrors'] = (list) => {
  if (!Array.isArray(list) || list.length === 0) return [];
  return list.map(toYamlError);
};

/**
 * Convert a single normalized diagnostic into a mutable YAML parser error.
 * - Produces `{ name: "YAMLParseError", message, code, pos, linePos? }`.
 * - Used for legacy or parser-level interoperability.
 */
export const toYamlError: D['toYamlError'] = (d: t.Yaml.Diagnostic) => {
  const start = d.pos?.[0] ?? d.range?.[0] ?? 0;
  const end = d.pos?.[1] ?? d.range?.[1] ?? start; // ← zero-length allowed
  const pos: [number, number] = [start, end]; //      ← mutable tuple for parser compatibility

  // Optional line/col coordinates (expand single → pair)
  type T = [t.LinePos, t.LinePos];
  const linePos =
    Array.isArray(d.linePos) && d.linePos.length > 0
      ? ((d.linePos.length === 2
          ? [d.linePos[0], d.linePos[1]]
          : [d.linePos[0], d.linePos[0]]) as T)
      : undefined;

  const out: t.Yaml.Error = {
    name: 'YAMLParseError',
    message: d.message,
    code: d.code as any, // preserve numeric or string codes
    pos,
    ...(linePos ? { linePos } : {}),
  };

  return out;
};
