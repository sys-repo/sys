import { type t, Fs } from './common.ts';
import { BundleProfileSchema } from './u.schema.profile.ts';

export type BundleProfile = {
  readonly 'bundle:slug-tree:fs'?: t.LintSlugTree;
  readonly 'bundle:slug-tree:media:seq'?: t.LintMediaSeqBundle;
};

export async function readBundleProfile(path: t.StringFile): Promise<BundleProfile> {
  const res = await Fs.readYaml<BundleProfile>(path);
  if (!res.ok || !res.exists) return BundleProfileSchema.initial();
  const doc = res.data ?? {};
  return BundleProfileSchema.validate(doc).ok ? doc : BundleProfileSchema.initial();
}
