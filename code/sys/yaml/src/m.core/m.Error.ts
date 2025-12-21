import { type t } from './common.ts';

export const Error: t.YamlErrorLib = {
  synthetic({ message, pos, name, code }) {
    const err = new globalThis.Error(message) as t.Yaml.Error;

    // YAML parser-compatible defaults (structural only).
    err.name = name ?? 'YAMLParseError';
    err.code = code ?? 'BAD_ALIAS';

    // Ensure required, mutable tuple (not readonly) for the upstream error shape.
    const tuple: [number, number] = pos ? [pos[0], pos[1]] : [0, 0];
    err.pos = tuple;

    return err;
  },
};
