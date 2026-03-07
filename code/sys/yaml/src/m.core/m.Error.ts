import { type t } from './common.ts';

export const Error: t.YamlErrorLib = {
  synthetic({ message, pos, name, code }) {
    const err = new globalThis.Error(message) as t.Yaml.Error;

    // YAML parser-compatible defaults (structural only).
    err.name = name ?? 'YAMLParseError';
    err.code = code ?? 'BAD_ALIAS';

    // Only attach `pos` when supplied, so callers can distinguish "no position".
    if (pos) {
      const tuple: [number, number] = [pos[0], pos[1]];
      err.pos = tuple;
    }

    return err;
  },
};
