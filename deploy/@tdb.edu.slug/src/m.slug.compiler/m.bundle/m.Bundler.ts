import { type t } from '../common.ts';
import { bundleSequenceFilepaths } from '../m.lint/u.lint.seq.files.bundle.ts';
import { runSlugTreeFs } from '../m.lint/u.lint.slug-tree.ts';
import { readLintProfile } from '../m.lint/u.lint.util.ts';

export const Bundler = {
  async slugTreeFs(args: {
    cwd: t.StringDir;
    profilePath: t.StringFile;
    createCrdt: () => Promise<t.StringRef>;
  }): Promise<void> {
    await runSlugTreeFs(args);
  },

  async mediaSeq(args: {
    dag: t.Graph.Dag.Result;
    profilePath: t.StringFile;
    docid: t.Crdt.Id;
  }): Promise<void> {
    const { dag, profilePath, docid } = args;
    const profile = await readLintProfile(profilePath);
    const mediaSeq = profile['bundle:slug-tree:media:seq'];
    if (!mediaSeq) return;

    const yamlPath = parseYamlPath(mediaSeq.crdt.path);
    await bundleSequenceFilepaths(dag, yamlPath, docid, {
      facets: ['bundle:slug-tree:media:seq'],
      target: mediaSeq.target,
      requirePlayback: mediaSeq.requirePlayback,
    });
  },
} as const;

function parseYamlPath(input: t.StringPath): t.ObjectPath {
  const raw = String(input ?? '').trim();
  if (!raw) return [] as t.ObjectPath;
  const parts = raw.split('/').filter((p) => p.length > 0);
  return parts as t.ObjectPath;
}
