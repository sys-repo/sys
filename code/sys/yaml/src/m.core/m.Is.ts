import { YAMLError } from 'yaml';
import { type t, ERR } from './common.ts';

export const Is: t.YamlIsLib = {
  parseError(input?: unknown): input is t.YamlError {
    if (input == null) return false;
    if (input instanceof YAMLError) return true;

    const e = input as any;
    if (typeof e === 'object') {
      if ('pos' in e) return Is.posTuple((e as any).pos);
      if (e?.name === ERR.PARSE) return true;
      if (e?.cause?.name === ERR.PARSE) return true;
    }

    return false;
  },

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
    return Array.isArray(input) && input.every((v) => Is.parseError(v));
  },

  diagnosticArray(input?: unknown): input is t.YamlDiagnostic[] {
    return Array.isArray(input) && input.every((v) => Is.diagnostic(v));
  },
};
