import { type t, Fs, Schema } from './common.ts';
import { SchemaBundleConfig } from './schema/mod.ts';

export type BundleConfigValidation = {
  ok: boolean;
  errors: readonly t.ValueError[];
};

export async function validateBundleConfig(path: t.StringFile): Promise<BundleConfigValidation> {
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
    };
  }

  const doc = res.data ?? {};
  const bundleDoc = {
    'bundle:slug-tree:fs': doc['bundle:slug-tree:fs'],
    'bundle:slug-tree:media:seq': doc['bundle:slug-tree:media:seq'],
  };

  const ok = Schema.Value.Check(SchemaBundleConfig, bundleDoc);
  const errors = ok ? [] : [...Schema.Value.Errors(SchemaBundleConfig, bundleDoc)];
  return { ok, errors } as const;
}
