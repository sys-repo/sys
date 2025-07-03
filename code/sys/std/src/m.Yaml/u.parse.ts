import { type t, Err, parseYaml } from './common.ts';

export const parse: t.YamlLib['parse'] = <T>(input: string) => {
  try {
    const data = parseYaml(input ?? '') as T;
    return { data };
  } catch (cause: any) {
    const error = Err.std('Failed to parse YAML', { cause });
    return { error };
  }
};
