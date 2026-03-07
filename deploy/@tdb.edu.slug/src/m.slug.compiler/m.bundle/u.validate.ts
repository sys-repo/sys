import { type t, Fs, Schema } from './common.ts';
import { SchemaBundleConfig } from './schema/mod.ts';

export const validate: t.SlugBundleLib['validate'] = async (args) => {
  const { path } = args;
  const res = await Fs.readYaml<Record<string, unknown>>(path);
  if (!res.ok || !res.exists) {
    return {
      ok: false,
      errors: [
        {
          path: 'file',
          message: `Bundle config not found: ${path}`,
        } as t.ValueError,
      ],
    } as const;
  }

  const doc = res.data ?? {};
  const ok = Schema.Value.Check(SchemaBundleConfig, doc);
  const errors = ok ? [] : [...Schema.Value.Errors(SchemaBundleConfig, doc)];
  return { ok, errors } as const;
};
