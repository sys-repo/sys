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
};
}
