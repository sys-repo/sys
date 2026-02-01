import { type t, c, Fs } from './common.ts';
import { buildDocumentDag } from './u.dag.ts';
import { bundleSequenceFilepaths } from './u.seq.files.bundle.ts';
import { runSlugTreeFs } from './u.slug-tree.ts';
import { validate } from './u.validate.ts';
import { BundleProfileSchema } from './schema/mod.ts';

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

export async function runProfile(args: {
  cwd: t.StringDir;
  cmd: t.Crdt.Cmd.Client;
  profilePath: t.StringFile;
}): Promise<void> {
  const { cwd, cmd, profilePath } = args;
  const validation = await validate({ path: profilePath });
  if (!validation.ok) {
    console.info(
      c.yellow(`bundle profile invalid:\n  ${formatValidationErrors(validation.errors)}`),
    );
    return;
  }

  const profile = await readBundleProfile(profilePath);
  const mediaSeq = profile['bundle:slug-tree:media:seq'];
  if (mediaSeq) {
    const rawDocid = String(mediaSeq.crdt.docid ?? '').trim();
    if (!rawDocid || rawDocid === '<tbd>') {
      console.info(
        c.yellow('warning: bundle:slug-tree:media:seq skipped (crdt.docid missing or placeholder)'),
      );
    } else {
      const docid = rawDocid.startsWith('crdt:')
        ? (rawDocid as t.Crdt.Id)
        : (`crdt:${rawDocid}` as t.Crdt.Id);
      const yamlPath = parseYamlPath(mediaSeq.crdt.path);
      const dag = await buildDocumentDag(cmd, docid, yamlPath);
      await bundleSequenceFilepaths(dag, yamlPath, docid, {
        target: mediaSeq.target,
        requirePlayback: mediaSeq.requirePlayback,
      });
    }
  }

  if (profile['bundle:slug-tree:fs']) {
    await runSlugTreeFs({
      cwd,
      profilePath,
      createCrdt: async () => 'crdt:create' as t.StringRef,
    });
  }
}

function formatValidationErrors(errors: readonly t.ValueError[]): string {
  return errors
    .map((err) => `${String(err.path ?? '').trim() || '<root>'}: ${err.message}`)
    .join('\n  ');
}

function parseYamlPath(input: t.StringPath): t.ObjectPath {
  const raw = String(input ?? '').trim();
  if (!raw) return [] as t.ObjectPath;
  const parts = raw.split('/').filter((p) => p.length > 0);
  return parts as t.ObjectPath;
}
