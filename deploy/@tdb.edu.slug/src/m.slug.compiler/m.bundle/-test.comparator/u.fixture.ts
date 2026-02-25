import { type t, Crdt, Fs, Is, Json } from '../common.ts';
import { readBundleProfile } from '../u.profile.ts';
import type { EvalRunOutput } from './u.normalize.ts';

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
    const destPath = Fs.join(args.targetManifestsDir, filename);
    await Fs.write(destPath, raw);

    files[key] = destPath;
    artifacts[key] = Json.parse(raw);
  }

  return { files, artifacts };
}

type MediaSeqContext = {
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
  const bundle = (profile.bundles ?? []).find((b) => b.kind === 'slug-tree:media:seq' && b.enabled !== false);
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
  const templates = {
    assets: String(manifests.assets ?? 'slug.<docid>.assets.json'),
    playback: String(manifests.playback ?? 'slug.<docid>.playback.json'),
    tree: String(manifests.tree ?? 'slug-tree.<docid>.json'),
  } as const;

  if (!manifestsBase) throw new Error(`Invalid manifests.base in ${FIXTURE.profilePath}`);
  _cachedContext = { manifestsBase: manifestsBase as t.StringDir, templates };
  return _cachedContext;
}

function resolveManifestFilename(template: string, docid: string): string {
  if (!Is.string(template)) return String(template);
  return template.replaceAll('<docid>', docid);
}
