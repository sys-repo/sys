import { type t, Fs } from './common.ts';

export type BundleProfile = {
  readonly 'bundle:slug-tree:fs'?: t.LintSlugTree;
  readonly 'bundle:slug-tree:media:seq'?: t.LintMediaSeqBundle;
};

export async function readBundleProfile(path: t.StringFile): Promise<BundleProfile> {
  const res = await Fs.readYaml<BundleProfile>(path);
  if (!res.ok || !res.exists) return {};
  return res.data ?? {};
}
