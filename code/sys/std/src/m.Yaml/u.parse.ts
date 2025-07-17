import { parse as _parse, parseDocument as _parseDocument } from 'yaml';

import { type t, Err, ERR } from './common.ts';

export const parse: t.YamlLib['parse'] = <T>(input: string) => {
  try {
    const data = _parse(input ?? '') as T;
    return { data };
  } catch (cause: any) {
    const name = cause.name === ERR.PARSE ? ERR.PARSE : undefined;
    const error = Err.std('Failed to parse YAML', { name, cause });
    return { error };
  }
};

export const parseDocument: t.YamlLib['parseDocument'] = (src: string) => {
  return _parseDocument(src, { keepSourceTokens: true });
};
