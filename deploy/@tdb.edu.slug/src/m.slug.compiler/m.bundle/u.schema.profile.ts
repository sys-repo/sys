import { Schema, Yaml, type t } from './common.ts';
import { SchemaBundleConfig } from './u.schema.bundle.ts';

export const BundleProfileSchema = {
  initial(): t.BundleProfile {
    return {};
  },

  validate(value: unknown) {
    const ok = Schema.Value.Check(SchemaBundleConfig, value);
    const errors = ok ? [] : [...Schema.Value.Errors(SchemaBundleConfig, value)];
    return { ok: errors.length === 0, errors } as const;
  },

  stringify(doc: t.BundleProfile): string {
    return Yaml.stringify(doc).data ?? '';
  },
} as const;
