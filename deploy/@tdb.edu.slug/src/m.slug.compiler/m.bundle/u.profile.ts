import { type t, Crdt, Fs, Slug } from './common.ts';
import { buildDocumentDag } from './u.dag.ts';
import { writeDistClientFiles } from './u.dist.client.ts';
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
  const descriptorEntries: Array<{ dir: t.StringDir; bundle: t.BundleDescriptor }> = [];

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
        const descriptor = buildMediaSeqDescriptor({
          bundle,
          docid: nodeId,
          dir: result.dir,
        });
        if (descriptor) descriptorEntries.push(descriptor);
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
        const manifestsBase =
          bundle.target?.manifests?.base ?? Fs.join(Fs.cwd('terminal'), 'publish.assets');
        const manifestsDir = bundle.target?.manifests?.dir ?? 'manifests';
        const videoBase = bundle.target?.media?.video?.base ?? manifestsBase;
        const imageBase = bundle.target?.media?.image?.base ?? manifestsBase;
        const videoDir = bundle.target?.media?.video?.dir ?? 'video';
        const imageDir = bundle.target?.media?.image?.dir ?? 'image';
        const distDirs: t.StringDir[] = [
          manifestsBase,
          resolveDir(manifestsBase, manifestsDir),
          resolveDir(videoBase, videoDir),
        ];
        if (bundle.target?.media?.image !== undefined) {
          distDirs.push(resolveDir(imageBase, imageDir));
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
      const fsDescriptors = await buildSlugTreeFsDescriptors({ cwd, bundle });
      descriptorEntries.push(...fsDescriptors);
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

  if (descriptorEntries.length > 0) {
    await writeDistClientFiles(descriptorEntries);
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

function resolveDir(baseDir: t.StringDir, subPath: t.StringDir): t.StringDir {
  if (Fs.Path.Is.absolute(subPath)) return subPath;
  return Fs.join(baseDir, subPath);
}

const DESCRIPTOR_VERSION = 1;

function buildMediaSeqDescriptor(args: {
  bundle: t.SlugBundleMediaSeq;
  docid: t.Crdt.Id;
  dir: t.BundleSequenceResult['dir'];
}): { dir: t.StringDir; bundle: t.BundleDescriptor } | undefined {
  const baseDir = args.dir.base;
  const manifestsDir = args.dir.manifests;
  const descriptorDir = resolveDir(baseDir, manifestsDir);
  const docid = String(args.docid) as t.StringId;

  const cleaned = Crdt.Id.clean(docid) ?? docid;
  const assetsTemplate = args.bundle.target?.manifests?.assets ?? 'slug.<docid>.assets.json';
  const playbackTemplate = args.bundle.target?.manifests?.playback ?? 'slug.<docid>.playback.json';
  const treeTemplate = args.bundle.target?.manifests?.tree ?? 'slug-tree.<docid>.json';

  const assetsFilename = resolveTemplate(assetsTemplate, cleaned);
  const playbackFilename = resolveTemplate(playbackTemplate, cleaned);
  const treeFilename = resolveTemplate(treeTemplate, cleaned);

  const assetsPath = resolvePath(baseDir, manifestsDir, assetsFilename);
  const playbackPath = resolvePath(baseDir, manifestsDir, playbackFilename);
  const treePath = resolvePath(baseDir, manifestsDir, treeFilename);

  const includeVideo = args.bundle.target?.media
    ? args.bundle.target?.media?.video !== undefined
    : true;
  const includeImage = args.bundle.target?.media
    ? args.bundle.target?.media?.image !== undefined
    : true;

  const videoBase = args.bundle.target?.media?.video?.base ?? baseDir;
  const imageBase = args.bundle.target?.media?.image?.base ?? baseDir;
  const shareVideoBase = videoBase === baseDir;
  const shareImageBase = imageBase === baseDir;

  const mediaDirs =
    (includeVideo && shareVideoBase) || (includeImage && shareImageBase)
      ? {
          ...(includeVideo && shareVideoBase
            ? { video: toRelativeDir(baseDir, args.dir.video) }
            : {}),
          ...(includeImage && shareImageBase
            ? { image: toRelativeDir(baseDir, args.dir.image) }
            : {}),
        }
      : undefined;

  const bundle: t.BundleDescriptor = {
    kind: 'slug-tree:media:seq',
    version: DESCRIPTOR_VERSION,
    docid,
    layout: {
      manifestsDir: toRelativeDir(baseDir, manifestsDir),
      ...(mediaDirs ? { mediaDirs } : {}),
    },
    files: {
      assets: toRelativePath(baseDir, assetsPath),
      playback: toRelativePath(baseDir, playbackPath),
      tree: toRelativePath(baseDir, treePath),
    },
  };

  return { dir: descriptorDir, bundle };
}

async function buildSlugTreeFsDescriptors(args: {
  cwd: t.StringDir;
  bundle: t.SlugBundleFileTree;
}): Promise<Array<{ dir: t.StringDir; bundle: t.BundleDescriptor }>> {
  const targets = normalizeTargets(args.bundle.target?.manifest);
  if (targets.length === 0) return [];

  const docid = String(args.bundle.crdt.docid ?? '').trim();
  if (!docid) return [];

  const sha256Dir = resolveSha256Dir(args.cwd, args.bundle.target?.dir);
  const results: Array<{ dir: t.StringDir; bundle: t.BundleDescriptor }> = [];

  for (const target of targets) {
    const absPath = Fs.Path.resolve(args.cwd, Fs.Tilde.expand(String(target)));
    const ext = Fs.extname(absPath).toLowerCase();
    if (ext !== '.json') continue;

    const baseDir = Fs.dirname(absPath);
    const treePath = toRelativePath(baseDir, absPath);
    const assetsPath = deriveAssetsPath(absPath);
    const assetsExists = assetsPath ? await Fs.exists(assetsPath) : false;

    const layout = {
      manifestsDir: '.',
      ...(sha256Dir ? { contentDir: toRelativeDir(baseDir, sha256Dir) } : {}),
    };

    const bundle: t.BundleDescriptor = {
      kind: 'slug-tree:fs',
      version: DESCRIPTOR_VERSION,
      docid: docid as t.StringId,
      layout,
      files: {
        tree: treePath,
        ...(assetsExists && assetsPath
          ? { index: toRelativePath(baseDir, assetsPath) }
          : {}),
      },
    };

    results.push({ dir: baseDir, bundle });
  }

  return results;
}

function normalizeTargets(input?: t.StringPath | readonly t.StringPath[]): t.StringPath[] {
  if (!input) return [];
  const list = Array.isArray(input) ? input : [input];
  return list.map((value) => String(value).trim()).filter(Boolean) as t.StringPath[];
}

function resolveSha256Dir(
  cwd: t.StringDir,
  input?:
    | t.StringPath
    | t.SlugBundleFileTreeTargetDir
    | readonly t.SlugBundleFileTreeTargetDir[],
): t.StringDir | undefined {
  if (!input) return;
  const list = Array.isArray(input) ? input : [input];
  for (const item of list) {
    if (!item) continue;
    if (typeof item === 'string') continue;
    if (item.kind !== 'sha256') continue;
    const path = Fs.Path.resolve(cwd, Fs.Tilde.expand(String(item.path ?? '')));
    if (!path) continue;
    return path as t.StringDir;
  }
}

function resolveTemplate(value: string, docid: t.StringId): string {
  if (!value.includes('<docid>')) return value;
  return value.replaceAll('<docid>', docid);
}

function resolvePath(baseDir: string, subPath: string, filename?: string): string {
  if (filename && Fs.Path.Is.absolute(filename)) return filename;
  if (Fs.Path.Is.absolute(subPath)) {
    return filename ? Fs.join(subPath, filename) : subPath;
  }
  return filename ? Fs.join(baseDir, subPath, filename) : Fs.join(baseDir, subPath);
}

function toRelativeDir(baseDir: t.StringDir, dir: t.StringDir): t.StringDir {
  if (!dir) return dir;
  if (!Fs.Path.Is.absolute(dir)) return dir;
  const rel = Fs.Path.relative(baseDir, dir) || '.';
  return rel as t.StringDir;
}

function toRelativePath(baseDir: t.StringDir, path: string): t.StringPath {
  if (!path) return path as t.StringPath;
  if (!Fs.Path.Is.absolute(path)) return path as t.StringPath;
  const rel = Fs.Path.relative(baseDir, path) || Fs.basename(path);
  return rel as t.StringPath;
}

function deriveAssetsPath(path: t.StringFile): t.StringFile | undefined {
  const ext = Fs.extname(path).toLowerCase();
  if (ext !== '.json') return;
  const dir = Fs.dirname(path);
  const base = Fs.basename(path, ext);
  return Fs.join(dir, `${base}.assets${ext}`) as t.StringFile;
}
