import { type t, Err } from './common.ts';
import { stringify as impl } from 'yaml';

export function stringify<T>(value: T, options?: t.YamlStringifyOptions): t.YamlStringifyResult {
  try {
    const yaml = impl(value, options);
    return { data: yaml as t.StringYaml };
  } catch (err) {
    return { error: Err.std(err) };
  }
}
