import { type t, c, Fs, Slug } from './common.ts';
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
      const yamlPath = parseYamlPath(mediaSeq.crdt.path);
      const rootId = rawDocid.startsWith('crdt:')
        ? (rawDocid as t.Crdt.Id)
        : (`crdt:${rawDocid}` as t.Crdt.Id);
      const dag = await buildDocumentDag(cmd, rootId, yamlPath);
      const Sequence = Slug.Trait.MediaComposition.Sequence;
      let bundled = 0;

      for (const node of dag.nodes) {
        const nodeId = node.id as t.Crdt.Id;
        const seqResult = await Sequence.fromDag(dag, yamlPath, nodeId, { validate: false });
        if (!seqResult.ok) continue;
        bundled += 1;
        const result = await bundleSequenceFilepaths(dag, yamlPath, nodeId, {
          target: mediaSeq.target,
          requirePlayback: mediaSeq.requirePlayback,
        });
        if (result.issues.length > 0) {
          const counts = new Map<string, number>();
          for (const issue of result.issues) {
            const next = (counts.get(issue.kind) ?? 0) + 1;
            counts.set(issue.kind, next);
          }
          const summary = [...counts.entries()]
            .map(([kind, count]) => `${kind}=${count}`)
            .join(', ');
          console.info(
            c.yellow(
              `warning: bundle:slug-tree:media:seq issues (doc:${nodeId}, ${result.issues.length}): ${summary}`,
            ),
          );
        }
      }

      if (bundled === 0) {
        console.info(
          c.yellow(
            `warning: bundle:slug-tree:media:seq skipped (no media sequences found in DAG for ${rootId})`,
          ),
        );
      }
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
