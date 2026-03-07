import { YAMLError, isAlias, isMap, isPair, isScalar, isSeq } from 'yaml';
import { type t, ERR } from './common.ts';

export const YamlIs: t.YamlIsLib = {
  /**
   * Value types:
   */
  scalar: (input: unknown): input is t.Yaml.Scalar => isScalar(input),
  map: (input: unknown): input is t.Yaml.Map => isMap(input),
  seq: (input: unknown): input is t.Yaml.Seq => isSeq(input),
  pair: (input: unknown): input is t.Yaml.Pair => isPair(input),
  alias: (input: unknown): input is t.Yaml.Alias => isAlias(input),

  posTuple(pos: unknown): pos is [number, number] {
    return (
      Array.isArray(pos) &&
      pos.length === 2 &&
      Number.isInteger(pos[0]) &&
      pos[0] >= 0 &&
      Number.isInteger(pos[1]) &&
      pos[1] >= 0
    );
  },

  /**
   * Parsing:
   */
  parseError(input?: unknown): input is t.YamlError {
    if (input == null) return false;
    if (input instanceof YAMLError) return true;

    const e = input as any;
    if (typeof e === 'object') {
      if ('pos' in e) return YamlIs.posTuple((e as any).pos);
      if (e?.name === ERR.PARSE) return true;
      if (e?.cause?.name === ERR.PARSE) return true;
    }

    return false;
  },

  /**
   * Errors:
   */
  diagnostic(input?: unknown): input is t.YamlDiagnostic {
    const d = input as t.YamlDiagnostic;
    if (!d || typeof d.message !== 'string') return false;

    if (d.code !== undefined && typeof d.code !== 'string') return false;

    if (d.path !== undefined) {
      if (!Array.isArray(d.path)) return false;
      for (const seg of d.path) {
        if (typeof seg === 'string') continue;
        if (typeof seg === 'number' && Number.isInteger(seg)) continue;
        return false;
      }
    }

    if (d.range !== undefined) {
      if (!Array.isArray(d.range)) return false;
      if (d.range.length < 2 || d.range.length > 3) return false;
      for (const n of d.range) {
        if (!Number.isInteger(n) || n < 0) return false;
      }
    }

    return true;
  },

  /**
   * Array variants:
   */
  parseErrorArray(input?: unknown): input is t.YamlError[] {
    return Array.isArray(input) && input.every((v) => YamlIs.parseError(v));
  },

  diagnosticArray(input?: unknown): input is t.YamlDiagnostic[] {
    return Array.isArray(input) && input.every((v) => YamlIs.diagnostic(v));
  },
};
