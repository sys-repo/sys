import { type t, Fs, Slug } from './common.ts';
import { buildDocumentDag } from './u.dag.ts';
import { bundleSequenceFilepaths } from './u.seq.files.bundle.ts';
import { writeDistFiles } from './u.dist.ts';
import { runSlugTreeFs } from './u.tree.ts';
import { validate } from './u.validate.ts';
import { BundleProfileSchema } from './schema/mod.ts';

export async function readBundleProfile(path: t.StringFile): Promise<t.BundleProfile> {
  const res = await Fs.readYaml<t.BundleProfile>(path);
  if (!res.ok || !res.exists) return BundleProfileSchema.initial();
  const doc = res.data ?? {};
  return BundleProfileSchema.validate(doc).ok
    ? (doc as t.BundleProfile)
    : BundleProfileSchema.initial();
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
  const bundles = profile.bundles ?? [];
  let mediaSeqTotals: t.BundleRunSummary['mediaSeq'] | undefined;
  let slugTreeFsTotals: t.BundleRunSummary['slugTreeFs'] | undefined;

  for (const [i, bundle] of bundles.entries()) {
    if (bundle.enabled === false) continue;
    if (bundle.kind === 'slug-tree:media:seq') {
      const mediaStart = Date.now();
      const rawDocid = String(bundle.crdt.docid ?? '').trim();
      if (!rawDocid || rawDocid === '<tbd>') {
        const msg = `warning: bundle:slug-tree:media:seq skipped (bundle#${i + 1}, crdt.docid missing or placeholder)`;
        warnings.push(msg);
        continue;
      }

      const yamlPath = parseYamlPath(bundle.crdt.path);
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
          target: bundle.target,
          requirePlayback: bundle.requirePlayback,
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

          const msg = `warning: bundle:slug-tree:media:seq issues (bundle#${i + 1}, doc:${nodeId}, ${result.issues.length}): ${summaryText}`;
          warnings.push(msg);
        }
      }

      if (bundled === 0) {
        const msg = `warning: bundle:slug-tree:media:seq skipped (bundle#${i + 1}, no media sequences found in DAG for ${rootId})`;
        warnings.push(msg);
      }

      if (targets.length > 0) {
        const baseDir = bundle.target?.base ?? Fs.join(Fs.cwd('terminal'), 'publish.assets');
        const manifestsDir = bundle.target?.manifests?.dir ?? 'manifests';
        const videoDir = bundle.target?.media?.video ?? 'video';
        const imageDir = bundle.target?.media?.image ?? 'image';
        const distDirs: t.StringDir[] = [
          baseDir,
          resolveDir(baseDir, manifestsDir),
          resolveDir(baseDir, videoDir),
        ];
        if (bundle.target?.media?.image !== undefined) {
          distDirs.push(resolveDir(baseDir, imageDir));
        }
        await writeDistFiles(distDirs);
      }

      const prevDocs = mediaSeqTotals?.docs ?? [];
      const elapsed = Date.now() - mediaStart;
      mediaSeqTotals = {
        total: (mediaSeqTotals?.total ?? 0) + targets.length,
        bundled: (mediaSeqTotals?.bundled ?? 0) + bundled,
        docs: [...prevDocs, ...docSummaries],
        elapsed: (mediaSeqTotals?.elapsed ?? 0) + elapsed,
      };
      continue;
    }

    if (bundle.kind === 'slug-tree:fs') {
      args.onProgress?.({ stage: 'slug-tree:fs' });
      const stats = await runSlugTreeFs({
        cwd,
        config: bundle,
        createCrdt: async () => 'crdt:create' as t.StringRef,
      });
      const merged = {
        files: (slugTreeFsTotals?.files ?? 0) + (stats?.files ?? 0),
        sourceFiles: (slugTreeFsTotals?.sourceFiles ?? 0) + (stats?.sourceFiles ?? 0),
        sha256Files: (slugTreeFsTotals?.sha256Files ?? 0) + (stats?.sha256Files ?? 0),
        manifests: (slugTreeFsTotals?.manifests ?? 0) + (stats?.manifests ?? 0),
        elapsed: (slugTreeFsTotals?.elapsed ?? 0) + (stats?.elapsed ?? 0),
      };
      slugTreeFsTotals = { ran: true, ...merged };
      continue;
    }
  }

  if (mediaSeqTotals) summary = { ...summary, mediaSeq: mediaSeqTotals };
  if (slugTreeFsTotals) summary = { ...summary, slugTreeFs: slugTreeFsTotals };

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

function resolveDir(baseDir: t.StringDir, subPath: t.StringDir): t.StringDir {
  if (Fs.Path.Is.absolute(subPath)) return subPath;
  return Fs.join(baseDir, subPath);
}
