import { type t, Err, ERR, parseYaml } from './common.ts';

export const parse: t.YamlLib['parse'] = <T>(input: string) => {
  try {
    const data = parseYaml(input ?? '') as T;
    return { data };
  } catch (cause: any) {
    const name = cause.name === ERR.PARSE ? ERR.PARSE : undefined;
    const error = Err.std('Failed to parse YAML', { name, cause });
    return { error };
  }
};
