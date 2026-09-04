import { Schema, type t, Yaml } from './common.ts';
import { schema } from './s.root.ts';
import { initial } from './u.initial.ts';

/**
 * Profile config YAML schema.
 */
export const ProfileSchema = {
  initial,

  validate(value: unknown) {
    const ok = Schema.Value.Check(schema, value);
    const errors = ok ? [] : [...Schema.Value.Errors(schema, value)];
    return { ok, errors } as const;
  },

  stringify(doc: t.PiCliProfiles.Yaml.Profile): string {
    const res = Yaml.stringify(doc);
    if (res.error || !res.data) return '';
    return res.data;
  },

  schema,
} as const;
