import { parse as _parse, parseDocument as _parseDocument } from 'yaml';
import { type t, Err, ERR } from './common.ts';

export const parse: t.YamlLib['parse'] = <T>(src?: string) => {
  try {
    const raw = _parse(src ?? '') as T | null;
    return { data: raw, error: undefined } as t.YamlOk<T | null>;
  } catch (cause: unknown) {
    const name = (cause as any)?.name === ERR.PARSE ? ERR.PARSE : undefined;
    const error = Err.std('Failed to parse YAML', { name, cause });
    return { error, data: undefined } as t.YamlErr<t.StdError>;
  }
};

export const parseAst: t.YamlLib['parseAst'] = (src: string) => {
  return _parseDocument(src) as t.YamlAst;
};
