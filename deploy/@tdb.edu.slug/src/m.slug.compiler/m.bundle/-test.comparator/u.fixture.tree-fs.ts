import { type t, Fs, Is, Json } from '../common.ts';
import { runSlugTreeFs, runSlugTreeFs_NEW } from '../u.bundle.tree.fs.ts';
import { readBundleProfile } from '../u.profile.ts';
import { FIXTURE } from './u.fixture.ts';
import type { EvalRunOutput } from './u.normalize.ts';

export type EvalRunProvider = (args: {
  docid: t.StringId;
  outDir: t.StringDir;
}) => Promise<EvalRunOutput>;

export async function baselineTreeFsProvider(args: {
  docid: t.StringId;
  outDir: t.StringDir;
}): Promise<EvalRunOutput> {
  return await runTreeFsProvider(args, runSlugTreeFs);
}

export async function candidateTreeFsProvider(args: {
  docid: t.StringId;
  outDir: t.StringDir;
}): Promise<EvalRunOutput> {
  return await runTreeFsProvider(args, runSlugTreeFs_NEW);
}

export async function canRunTreeFsProviders(): Promise<{
  readonly ok: boolean;
  readonly reason?: string;
}> {
  try {
    await resolveTreeFsContext();
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, reason: message };
  }
}

type TreeFsContext = {
  readonly cwd: t.StringDir;
  readonly config: t.SlugBundleFileTree;
};

let _cachedContext: TreeFsContext | undefined;
async function resolveTreeFsContext(): Promise<TreeFsContext> {
  if (_cachedContext) return _cachedContext;
  const profile = await readBundleProfile(FIXTURE.profilePath);
  const bundle = (profile.bundles ?? []).find(
    (b): b is Extract<t.BundleConfig, { kind: 'slug-tree:fs' }> =>
      b.kind === 'slug-tree:fs' && b.enabled !== false,
  );
  if (!bundle) throw new Error(`No enabled "slug-tree:fs" bundle found in ${FIXTURE.profilePath}`);

  const source = Fs.Tilde.expand(String(bundle.source ?? '.'));
  const sourceRoot = Fs.Path.resolve(FIXTURE.profileCwd, source || '.');
  if (!(await Fs.exists(sourceRoot))) {
    throw new Error(`Tree-fs source path does not exist: ${sourceRoot}`);
  }

  _cachedContext = {
    cwd: FIXTURE.profileCwd,
    config: bundle,
  };
  return _cachedContext;
}

async function runTreeFsProvider(
  args: { docid: t.StringId; outDir: t.StringDir },
  runner: (args: { cwd: t.StringDir; config: t.SlugBundleFileTree }) => Promise<t.SlugBundleFileTreeStats | undefined>,
): Promise<EvalRunOutput> {
  const ctx = await resolveTreeFsContext();
  const config = rewriteTreeFsTarget(ctx.config, args.outDir);
  await runner({ cwd: ctx.cwd, config });
  return await collectTreeFsArtifacts({ docid: resolveTreeFsDocid(config, args.docid), outDir: args.outDir, config });
}

async function collectTreeFsArtifacts(args: {
  docid: t.StringId;
  outDir: t.StringDir;
  config: t.SlugBundleFileTree;
}): Promise<EvalRunOutput> {
  const manifestTargets = normalizeTargets(args.config.target?.manifests);
  const jsonManifest = manifestTargets
    .map((path) => Fs.Path.resolve(FIXTURE.profileCwd, Fs.Tilde.expand(String(path))))
    .find((path) => Fs.extname(path).toLowerCase() === '.json');

  const files: {
    assets?: t.StringFile;
    tree?: t.StringFile;
    docs?: readonly t.StringFile[];
  } = {};
  const artifacts: {
    assets?: unknown;
    tree?: unknown;
    docs?: readonly unknown[];
  } = {};

  if (jsonManifest && (await Fs.exists(jsonManifest))) {
    files.tree = jsonManifest as t.StringFile;
    artifacts.tree = Json.parse((await Fs.readText(jsonManifest)).data ?? '');

    const assets = deriveAssetsPath(jsonManifest as t.StringFile);
    if (assets && (await Fs.exists(assets))) {
      files.assets = assets as t.StringFile;
      artifacts.assets = Json.parse((await Fs.readText(assets)).data ?? '');
    }
  }

  const docs = await collectSha256Docs(args.config);
  if (docs.files.length > 0) {
    files.docs = docs.files;
    artifacts.docs = docs.artifacts;
  }

  return {
    context: { docid: args.docid, outDir: args.outDir },
    files,
    artifacts,
  };
}

async function collectSha256Docs(config: t.SlugBundleFileTree): Promise<{
  readonly files: readonly t.StringFile[];
  readonly artifacts: readonly unknown[];
}> {
  const dirs = normalizeTargetDirs(config.target?.dir)
    .filter((dir) => dir.kind === 'sha256')
    .map((dir) => Fs.Path.resolve(FIXTURE.profileCwd, Fs.Tilde.expand(String(dir.path))))
    .filter((path) => path.length > 0);

  const collected: Array<{ path: t.StringFile; value: unknown }> = [];

  for (const dir of dirs) {
    if (!(await Fs.exists(dir))) continue;
    for await (const entry of Deno.readDir(dir)) {
      if (!entry.isFile || !entry.name.endsWith('.json') || entry.name === 'dist.json') continue;
      const path = Fs.join(dir, entry.name) as t.StringFile;
      const raw = (await Fs.readText(path)).data ?? '';
      collected.push({ path, value: Json.parse(raw) });
    }
  }

  collected.sort((a, b) => a.path.localeCompare(b.path));
  return {
    files: collected.map((item) => item.path),
    artifacts: collected.map((item) => item.value),
  };
}

function rewriteTreeFsTarget(
  config: t.SlugBundleFileTree,
  outDir: t.StringDir,
): t.SlugBundleFileTree {
  const cloned = Json.parse(Json.stringify(config)) as t.SlugBundleFileTree;
  const target = Is.record(cloned.target)
    ? (cloned.target as {
        manifests?: t.StringPath | readonly t.StringPath[];
        dir?: t.StringPath | t.SlugBundleFileTreeTargetDir | readonly t.SlugBundleFileTreeTargetDir[];
      })
    : {};

  const manifests = normalizeTargets(target.manifests);
  target.manifests = manifests.length > 0
    ? manifests.map((path) => Fs.join(outDir, '-manifests', Fs.basename(String(path))) as t.StringPath)
    : [Fs.join(outDir, '-manifests', `slug-tree.${resolveTreeFsDocid(config, 'tree-fs' as t.StringId)}.json`) as t.StringPath];

  const dirs = normalizeTargetDirs(target.dir);
  target.dir = dirs.length > 0
    ? dirs.map((dir) => {
        const name = Fs.basename(String(dir.path).replace(/[/\\]+$/, '')) || dir.kind;
        return {
          kind: dir.kind,
          path: Fs.join(outDir, name) as t.StringDir,
        };
      })
    : [{ kind: 'sha256', path: Fs.join(outDir, 'sha256') as t.StringDir }];

  return {
    ...cloned,
    target,
  };
}

function resolveTreeFsDocid(config: t.SlugBundleFileTree, fallback: t.StringId): t.StringId {
  const explicit = String(config.docid ?? '').trim();
  if (explicit) return explicit as t.StringId;

  const targets = normalizeTargets(config.target?.manifests);
  const fromTarget = targets
    .map((path) => Fs.basename(String(path)))
    .map((name) => /^slug-tree\.([^.]+)\.(json|ya?ml)$/i.exec(name)?.[1])
    .find((id) => !!id);

  return (fromTarget ?? String(fallback)) as t.StringId;
}

function normalizeTargets(input?: t.StringPath | readonly t.StringPath[]): t.StringPath[] {
  if (!input) return [];
  const list = Array.isArray(input) ? input : [input];
  return list.map((path) => String(path).trim()).filter(Boolean) as t.StringPath[];
}

function normalizeTargetDirs(
  input?: t.StringPath | t.SlugBundleFileTreeTargetDir | readonly t.SlugBundleFileTreeTargetDir[],
): t.SlugBundleFileTreeTargetDir[] {
  if (!input) return [];
  if (typeof input === 'string') return [{ kind: 'source', path: input }];
  if (Array.isArray(input)) return input.filter(Boolean) as t.SlugBundleFileTreeTargetDir[];
  return [input as t.SlugBundleFileTreeTargetDir];
}

function deriveAssetsPath(path: t.StringFile): t.StringFile | undefined {
  const ext = Fs.extname(path).toLowerCase();
  if (ext !== '.json') return;
  const dir = Fs.dirname(path);
  const base = Fs.basename(path, ext);
  return Fs.join(dir, `${base}.assets${ext}`) as t.StringFile;
}
