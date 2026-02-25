import { type t, Crdt, Fs, Is, Json } from '../common.ts';
import { buildDocumentDag } from '../u.dag.ts';
import {
  bundleSequenceFilepaths,
  bundleSequenceFilepathsViaTransform,
} from '../u.bundle.seq.files.ts';
import { readBundleProfile } from '../u.profile.ts';
import type { EvalRunOutput } from './u.normalize.ts';
import { RepoProcess } from '../../../../../../code/sys.tools/src/cli.crdt/cmd.repo.daemon/mod.ts';
import { CrdtReposFs } from '../../../../../../code/sys.tools/src/cli.crdt/u.config.repo/u.fs.ts';

const HERE = decodeURIComponent(new URL('.', import.meta.url).pathname) as t.StringDir;
const CONFIG_CWD = Fs.Path.resolve(HERE, '../../../../../../code/sys.tools/.tmp') as t.StringDir;
const CONFIG_PATH = Fs.join(
  CONFIG_CWD,
  '-config',
  '@tdb.edu-slug',
  'bundle',
  'slc.yaml',
) as t.StringFile;

export const FIXTURE = {
  profilePath: CONFIG_PATH as t.StringFile,
  profileCwd: CONFIG_CWD as t.StringDir,
  docids: [
    '2esGLgD5SoQkeucytmGeadm9cC7y',
    '2irtwwtQNj8GVrUguPjNERrAgLMx',
  ] as const,
} as const;

export type EvalRunProvider = (args: {
  docid: t.StringId;
  outDir: t.StringDir;
}) => Promise<EvalRunOutput>;

export type MaybeEvalRunProvider = EvalRunProvider | undefined;

export async function withEvalTempDirs<T>(
  fn: (args: { baselineOut: t.StringDir; candidateOut: t.StringDir }) => Promise<T>,
): Promise<T> {
  const root = (await Fs.makeTempDir()).absolute;
  const baselineOut = Fs.join(root, 'baseline') as t.StringDir;
  const candidateOut = Fs.join(root, 'candidate') as t.StringDir;
  await Fs.ensureDir(baselineOut);
  await Fs.ensureDir(candidateOut);
  try {
    return await fn({ baselineOut, candidateOut });
  } finally {
    await Fs.remove(root);
  }
}

export async function baselineSnapshotProvider(args: {
  docid: t.StringId;
  outDir: t.StringDir;
}): Promise<EvalRunOutput> {
  const ctx = await resolveMediaSeqContext();
  const cleaned = Crdt.Id.clean(String(args.docid)) ?? String(args.docid);
  const manifestsDir = Fs.Path.resolve(FIXTURE.profileCwd, ctx.manifestsBase);
  const targetManifestsDir = Fs.join(args.outDir, 'manifests');
  await Fs.ensureDir(targetManifestsDir);

  const files = {
    assets: resolveManifestFilename(ctx.templates.assets, cleaned),
    playback: resolveManifestFilename(ctx.templates.playback, cleaned),
    tree: resolveManifestFilename(ctx.templates.tree, cleaned),
  } as const;

  const copied = await collectArtifacts({
    sourceManifestsDir: manifestsDir,
    targetManifestsDir,
    files,
  });

  return {
    context: { docid: args.docid, outDir: args.outDir },
    files: copied.files,
    artifacts: copied.artifacts,
  };
}

export async function baselineLiveProvider(args: {
  docid: t.StringId;
  outDir: t.StringDir;
}): Promise<EvalRunOutput> {
  return await liveBundleProvider({ ...args, mode: 'baseline' });
}

export async function candidateLiveProvider(args: {
  docid: t.StringId;
  outDir: t.StringDir;
}): Promise<EvalRunOutput> {
  return await liveBundleProvider({ ...args, mode: 'candidate' });
}

export async function canRunLiveProviders(): Promise<boolean> {
  return (await getCmdClient()) !== undefined;
}

export function disposeLiveProviders(): void {
  const client = _cmdClient ?? undefined;
  _cmdClient = undefined;
  if (!client) return;
  try {
    client.dispose();
  } catch {}
}

async function collectArtifacts(args: {
  sourceManifestsDir: t.StringDir;
  targetManifestsDir: t.StringDir;
  files: { assets: string; playback: string; tree: string };
}) {
  const files: { assets?: t.StringFile; playback?: t.StringFile; tree?: t.StringFile } = {};
  const artifacts: { assets?: unknown; playback?: unknown; tree?: unknown } = {};

  for (const key of ['assets', 'playback', 'tree'] as const) {
    const filename = args.files[key];
    const sourcePath = Fs.join(args.sourceManifestsDir, filename);
    if (!(await Fs.exists(sourcePath))) continue;

    const raw = (await Fs.readText(sourcePath)).data ?? '';
    await Fs.ensureDir(args.targetManifestsDir);
    const destPath = Fs.join(args.targetManifestsDir, filename);
    await Fs.write(destPath, raw);

    files[key] = destPath;
    artifacts[key] = Json.parse(raw);
  }

  return { files, artifacts };
}

type MediaSeqContext = {
  readonly rootDocid: t.Crdt.Id;
  readonly yamlPath: t.ObjectPath;
  readonly requirePlayback?: boolean;
  readonly target?: t.SlugBundleMediaSeq['target'];
  readonly manifestsBase: t.StringDir;
  readonly templates: {
    readonly assets: string;
    readonly playback: string;
    readonly tree: string;
  };
};

let _cachedContext: MediaSeqContext | undefined;
async function resolveMediaSeqContext(): Promise<MediaSeqContext> {
  if (_cachedContext) return _cachedContext;
  const profile = await readBundleProfile(FIXTURE.profilePath);
  const bundle = (profile.bundles ?? []).find(
    (b): b is Extract<t.BundleConfig, { kind: 'slug-tree:media:seq' }> =>
      b.kind === 'slug-tree:media:seq' && b.enabled !== false,
  );
  if (!bundle) throw new Error(`No enabled "slug-tree:media:seq" bundle found in ${FIXTURE.profilePath}`);

  const target = bundle.target ?? {};
  const manifests =
    Is.record(target.manifests) && !Is.array(target.manifests)
      ? (target.manifests as {
          base?: string;
          assets?: string;
          playback?: string;
          tree?: string;
        })
      : {};
  const manifestsBase = String(manifests.base ?? '.').trim();
  const rawRootDocid = String(bundle.crdt?.docid ?? '').trim();
  if (!rawRootDocid) throw new Error(`Missing crdt.docid in ${FIXTURE.profilePath}`);
  const rootDocid = (rawRootDocid.startsWith('crdt:') ? rawRootDocid : `crdt:${rawRootDocid}`) as t.Crdt.Id;
  const yamlPath = parseYamlPath(String(bundle.crdt?.path ?? ''));
  const templates = {
    assets: String(manifests.assets ?? 'slug.<docid>.assets.json'),
    playback: String(manifests.playback ?? 'slug.<docid>.playback.json'),
    tree: String(manifests.tree ?? 'slug-tree.<docid>.json'),
  } as const;

  if (!manifestsBase) throw new Error(`Invalid manifests.base in ${FIXTURE.profilePath}`);
  _cachedContext = {
    rootDocid,
    yamlPath,
    requirePlayback: bundle.requirePlayback,
    target: bundle.target,
    manifestsBase: manifestsBase as t.StringDir,
    templates,
  };
  return _cachedContext!;
}

function resolveManifestFilename(template: string, docid: string): string {
  if (!Is.string(template)) return String(template);
  return template.replaceAll('<docid>', docid);
}

async function liveBundleProvider(args: {
  docid: t.StringId;
  outDir: t.StringDir;
  mode: 'baseline' | 'candidate';
}): Promise<EvalRunOutput> {
  const ctx = await resolveMediaSeqContext();
  const cmd = await getCmdClient();
  if (!cmd) {
    throw new Error(
      `CRDT repo daemon is not available for live parity provider (cwd=${FIXTURE.profileCwd}).`,
    );
  }

  const dag = await buildDocumentDag(cmd, ctx.rootDocid, ctx.yamlPath);
  const docid = (`crdt:${String(args.docid).replace(/^crdt:/, '')}`) as t.Crdt.Id;
  const target = rewriteTargetBases(ctx.target, args.outDir);
  const runner =
    args.mode === 'candidate' ? bundleSequenceFilepathsViaTransform : bundleSequenceFilepaths;

  const result = await runner(dag, ctx.yamlPath, docid, {
    target,
    requirePlayback: ctx.requirePlayback,
  });

  const cleaned = Crdt.Id.clean(String(docid)) ?? String(docid);
  const templates = ctx.templates;
  const files = {
    assets: resolveManifestFilename(templates.assets, cleaned),
    playback: resolveManifestFilename(templates.playback, cleaned),
    tree: resolveManifestFilename(templates.tree, cleaned),
  } as const;
  const manifestsDir = Fs.join(args.outDir, String(target?.manifests?.dir ?? 'manifests'));
  const collected = await collectArtifacts({
    sourceManifestsDir: manifestsDir as t.StringDir,
    targetManifestsDir: Fs.join(args.outDir, '_collected') as t.StringDir,
    files,
  });

  return {
    context: { docid: String(args.docid) as t.StringId, outDir: args.outDir },
    files: collected.files,
    artifacts: collected.artifacts,
    result: {
      issues: result.issues.map((issue) => ({
        kind: issue.kind,
        severity: issue.severity,
        path: issue.path,
        raw: issue.raw,
        message: issue.message,
      })),
      // Omit dir for now because baseline/candidate out roots differ by design.
    },
  };
}

function rewriteTargetBases(
  target: t.SlugBundleMediaSeq['target'] | undefined,
  outDir: t.StringDir,
): t.SlugBundleMediaSeq['target'] | undefined {
  const next = target ? Json.parse(Json.stringify(target)) : {};
  const obj = (Is.record(next) ? next : {}) as Record<string, unknown>;
  const manifests = (Is.record(obj['manifests']) ? obj['manifests'] : {}) as Record<string, unknown>;
  const media = (Is.record(obj['media']) ? obj['media'] : {}) as Record<string, unknown>;
  const video = (Is.record(media['video']) ? media['video'] : undefined) as Record<string, unknown> | undefined;
  const image = (Is.record(media['image']) ? media['image'] : undefined) as Record<string, unknown> | undefined;

  manifests['base'] = outDir;
  if (video) video['base'] = outDir;
  if (image) image['base'] = outDir;
  obj['manifests'] = manifests;
  obj['media'] = media;
  return obj as t.SlugBundleMediaSeq['target'];
}

let _cmdClient: t.Crdt.Cmd.Client | undefined | null;
async function getCmdClient(): Promise<t.Crdt.Cmd.Client | undefined> {
  if (_cmdClient !== undefined) return _cmdClient ?? undefined;
  const ports = await CrdtReposFs.loadPorts(FIXTURE.profileCwd);
  _cmdClient = (await RepoProcess.tryClient(ports.repo)) ?? null;
  return _cmdClient ?? undefined;
}

function parseYamlPath(input: t.StringPath): t.ObjectPath {
  const raw = String(input ?? '').trim();
  if (!raw) return [] as t.ObjectPath;
  return raw
    .split('/')
    .filter((p) => p.length > 0) as t.ObjectPath;
}
