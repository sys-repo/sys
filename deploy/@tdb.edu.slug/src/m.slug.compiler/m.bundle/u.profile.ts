import { type t, Fs, Slug } from './common.ts';
import { buildDocumentDag } from './u.dag.ts';
import { bundleSequenceFilepaths } from './u.seq.files.bundle.ts';
import { runSlugTreeFs } from './u.tree.ts';
import { validate } from './u.validate.ts';
import { BundleProfileSchema } from './schema/mod.ts';

export async function readBundleProfile(path: t.StringFile): Promise<t.BundleProfile> {
  const res = await Fs.readYaml<t.BundleProfile>(path);
  if (!res.ok || !res.exists) return BundleProfileSchema.initial();
  const doc = res.data ?? {};
  return BundleProfileSchema.validate(doc).ok ? doc : BundleProfileSchema.initial();
}

export async function runProfile(args: {
  cwd: t.StringDir;
  cmd: t.Crdt.Cmd.Client;
  profilePath: t.StringFile;
  onProgress?: (info: t.BundleRunProgress) => void;
}): Promise<t.BundleRunSummary> {
  const { cwd, cmd, profilePath } = args;
  const warnings: string[] = [];
  let summary: t.BundleRunSummary = { warnings };
  const validation = await validate({ path: profilePath });
  if (!validation.ok) {
    warnings.push(`bundle profile invalid:\n  ${formatValidationErrors(validation.errors)}`);
    return summary;
  }

  const profile = await readBundleProfile(profilePath);
  const mediaSeq = profile['bundle:slug-tree:media:seq'];
  if (mediaSeq) {
    const rawDocid = String(mediaSeq.crdt.docid ?? '').trim();
    if (!rawDocid || rawDocid === '<tbd>') {
      const msg = 'warning: bundle:slug-tree:media:seq skipped (crdt.docid missing or placeholder)';
      warnings.push(msg);
    } else {
      const yamlPath = parseYamlPath(mediaSeq.crdt.path);
      const rootId = rawDocid.startsWith('crdt:')
        ? (rawDocid as t.Crdt.Id)
        : (`crdt:${rawDocid}` as t.Crdt.Id);
      const dag = await buildDocumentDag(cmd, rootId, yamlPath);
      const Sequence = Slug.Trait.MediaComposition.Sequence;
      const targets: t.Crdt.Id[] = [];

      for (const node of dag.nodes) {
        const nodeId = node.id as t.Crdt.Id;
        const seqResult = await Sequence.fromDag(dag, yamlPath, nodeId, { validate: false });
        if (!seqResult.ok) continue;
        targets.push(nodeId);
      }

      const docSummaries: t.BundleRunDocSummary[] = [];
      let bundled = 0;
      for (const [index, nodeId] of targets.entries()) {
        args.onProgress?.({
          stage: 'media:seq',
          current: index + 1,
          total: targets.length,
          docid: nodeId,
        });
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
          docSummaries.push({
            docid: nodeId,
            issues: { total: result.issues.length, byKind: counts },
          });
          const summaryText = [...counts.entries()]
            .map(([kind, count]) => `${kind}=${count}`)
            .join(', ');

          const msg = `warning: bundle:slug-tree:media:seq issues (doc:${nodeId}, ${result.issues.length}): ${summaryText}`;
          warnings.push(msg);
        }
      }

      if (bundled === 0) {
        const msg = `warning: bundle:slug-tree:media:seq skipped (no media sequences found in DAG for ${rootId})`;
        warnings.push(msg);
      }
      summary = {
        ...summary,
        mediaSeq: {
          total: targets.length,
          bundled,
          docs: docSummaries,
        },
      };
    }
  }

  if (profile['bundle:slug-tree:fs']) {
    args.onProgress?.({ stage: 'slug-tree:fs' });
    const stats = await runSlugTreeFs({
      cwd,
      profilePath,
      createCrdt: async () => 'crdt:create' as t.StringRef,
    });
    summary = {
      ...summary,
      slugTreeFs: {
        ran: true,
        ...(stats ?? {
          files: 0,
          sourceFiles: 0,
          sha256Files: 0,
          manifests: 0,
          elapsedMs: 0,
        }),
      },
    };
  }

  return summary;
}

/**
 * Helpers:
 */
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
