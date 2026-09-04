import { Fs, Is, Str, type t, Url, Yaml, YamlConfig } from './common.ts';
import { validateBundleIsolation } from './u.bundle/u.isolation.ts';
import { PullFs, PullYamlSchema, validatePullYamlText } from './u.yaml/mod.ts';

export type PullAddInput = {
  cwd: t.StringDir;
  config: string;
  manifest: string;
  integrity: string;
  store: string;
  project?: string;
  mode?: t.GithubPull.Mode;
  dryRun?: boolean;
};

export type PullAddResult = {
  readonly kind: 'added' | 'exists' | 'dry-run';
  readonly yamlPath: t.StringPath;
  readonly createdConfig: boolean;
  readonly bundle: t.PullTool.ConfigYaml.DistBundle;
};

type PullAddChange = {
  readonly kind: 'added' | 'exists';
  readonly bundle: t.PullTool.ConfigYaml.DistBundle;
};

/** Add one externally pinned Dist bundle to durable Pull configuration. */
export async function addDistBundle(input: PullAddInput): Promise<PullAddResult> {
  const bundle = resolveBundle(input);
  const edit = await YamlConfig.Edit.update<t.PullTool.ConfigYaml.Doc, PullAddChange>({
    cwd: input.cwd,
    config: requireConfig(input.config),
    dryRun: input.dryRun,
    initial: () => PullYamlSchema.initial(),
    load: loadConfig,
    mutate: (doc) => addBundle(input.cwd, doc, bundle),
    stringify: stringifyDoc,
    validateText: validateDocText,
  });

  return {
    kind: edit.kind === 'dry-run' ? 'dry-run' : edit.change.kind,
    yamlPath: edit.path,
    createdConfig: edit.created,
    bundle: edit.change.bundle,
  };
}

/**
 * Helpers:
 */

function requireConfig(config: string): string {
  const text = String(config ?? '').trim();
  if (!text) throw new Error('Pull add: missing required flag: --config');
  return text;
}

async function loadConfig(path: t.StringPath): Promise<t.PullTool.ConfigYaml.Doc> {
  const loaded = await PullFs.validateYaml(path);
  if (!loaded.ok) throw new Error(`Pull add: invalid config: ${Fs.trimCwd(path)}`);
  return loaded.doc;
}

function addBundle(
  cwd: t.StringDir,
  source: t.PullTool.ConfigYaml.Doc,
  bundle: t.PullTool.ConfigYaml.DistBundle,
): t.YamlConfig.Edit.Mutation<t.PullTool.ConfigYaml.Doc, PullAddChange> {
  const doc = cloneDoc(source);
  const bundles = doc.bundles ?? [];
  assertIsolation(cwd, doc.dir, bundles);
  const exact = bundles.find((item) => item.kind === 'dist' && sameDist(item, bundle));
  if (exact?.kind === 'dist') {
    return { doc, changed: false, change: { kind: 'exists', bundle: exact } };
  }

  const project = bundle.project?.dir;
  if (project) {
    const occupied = bundles.find((item) => samePath(mutableTarget(item), project));
    if (occupied) {
      throw new Error(`Pull add: projection target already used: ${bundle.project?.dir}`);
    }
  }

  bundles.push(bundle);
  assertIsolation(cwd, doc.dir, bundles);
  doc.bundles = bundles;
  return { doc, changed: true, change: { kind: 'added', bundle } };
}

function resolveBundle(input: PullAddInput): t.PullTool.ConfigYaml.DistBundle {
  const manifest = manifestUrl(input.manifest);
  const integrity = canonicalIntegrity(input.integrity);
  const store = relativeDir(input.store, '--store');
  const project = optionalProject(input.project, input.mode);
  if (project && pathsOverlap(store, project.dir)) {
    throw new Error('Pull add: --project must be separate from the sealed-generation --store.');
  }
  return { kind: 'dist', manifest, integrity, store, project };
}

function manifestUrl(input: string): t.StringUrl {
  const text = String(input ?? '').trim();
  if (!Is.urlString(text)) {
    throw new Error('Pull add: --manifest must be an absolute HTTP(S) URL.');
  }
  const parsed = Url.parse(text);
  if (!parsed.ok) throw new Error('Pull add: --manifest must be an absolute HTTP(S) URL.');
  const url = parsed.toURL();
  if (url.username || url.password) {
    throw new Error('Pull add: --manifest must not contain userinfo.');
  }
  url.hash = '';
  return url.href as t.StringUrl;
}

function canonicalIntegrity(input: string): t.StringHash {
  const text = String(input ?? '').trim();
  if (!/^sha256-[0-9a-f]{64}$/.test(text)) {
    throw new Error('Pull add: --integrity must be a canonical publisher-provided SHA-256.');
  }
  return text as t.StringHash;
}

function optionalProject(
  input: string | undefined,
  mode: t.GithubPull.Mode | undefined,
): t.PullTool.ConfigYaml.DistProject | undefined {
  const text = String(input ?? '').trim();
  if (!text) {
    if (mode !== undefined) throw new Error('Pull add: --mode requires --project.');
    return undefined;
  }
  if (mode !== 'create' && mode !== 'replace') {
    throw new Error('Pull add: --project requires --mode create|replace.');
  }
  return { dir: relativeDir(text, '--project'), mode };
}

function relativeDir(input: string, flag: string): t.StringRelativeDir {
  const text = String(input ?? '').trim();
  if (!text) throw new Error(`Pull add: missing required flag: ${flag}`);
  if (text.startsWith('/') || text.startsWith('~') || /^[A-Za-z]:/.test(text)) {
    throw new Error(`Pull add: ${flag} must be relative to the config root.`);
  }

  const normalized = Str.trimLeadingDotSlash(text).replaceAll('\\', '/');
  if (!normalized || normalized === '.' || normalized === '..') {
    throw new Error(`Pull add: ${flag} must be a child directory under the config root.`);
  }
  if (normalized.startsWith('../') || normalized.endsWith('/..') || normalized.includes('/../')) {
    throw new Error(`Pull add: ${flag} must not traverse outside the config root.`);
  }
  if (normalized.split('/').some((part) => part === '.')) {
    throw new Error(`Pull add: ${flag} must not contain relative path aliases.`);
  }
  return text as t.StringRelativeDir;
}

function cloneDoc(doc: t.PullTool.ConfigYaml.Doc): t.PullTool.ConfigYaml.Doc {
  return {
    ...doc,
    bundles: doc.bundles?.map((bundle) => {
      if (bundle.kind === 'dist') {
        return { ...bundle, project: bundle.project ? { ...bundle.project } : undefined };
      }
      return { ...bundle, local: { ...bundle.local }, limits: { ...bundle.limits } };
    }),
  };
}

function assertIsolation(
  cwd: t.StringDir,
  dir: t.StringDir,
  bundles: t.PullTool.ConfigYaml.Bundle[],
): void {
  const baseDir = dir === '.' ? cwd : Fs.resolve(cwd, dir);
  const result = validateBundleIsolation({ dir: baseDir, bundles });
  if (!result.ok) throw new Error(`Pull add: ${result.error}`);
}

function stringifyDoc(doc: t.PullTool.ConfigYaml.Doc): string {
  const yaml = Yaml.stringify(doc);
  if (yaml.error || !yaml.data) throw new Error('Pull add: failed to stringify config.');
  return yaml.data;
}

function validateDocText(text: string, path: t.StringPath): void {
  const checked = validatePullYamlText(text);
  if (!checked.ok) throw new Error(`Pull add: generated invalid config: ${Fs.trimCwd(path)}`);
}

function sameDist(
  a: t.PullTool.ConfigYaml.DistBundle,
  b: t.PullTool.ConfigYaml.DistBundle,
): boolean {
  return a.manifest === b.manifest && a.integrity === b.integrity && samePath(a.store, b.store) &&
    sameProject(a.project, b.project);
}

function sameProject(
  a: t.PullTool.ConfigYaml.DistProject | undefined,
  b: t.PullTool.ConfigYaml.DistProject | undefined,
): boolean {
  if (!a || !b) return a === b;
  return samePath(a.dir, b.dir) && a.mode === b.mode;
}

function mutableTarget(bundle: t.PullTool.ConfigYaml.Bundle): string | undefined {
  return bundle.kind === 'dist' ? bundle.project?.dir : bundle.local.dir;
}

function samePath(a: string | undefined, b: string | undefined): boolean {
  return a !== undefined && b !== undefined && normalizePath(a) === normalizePath(b);
}

function pathsOverlap(a: string, b: string): boolean {
  const left = normalizePath(a);
  const right = normalizePath(b);
  return left === right || left.startsWith(`${right}/`) || right.startsWith(`${left}/`);
}

function normalizePath(input: string): string {
  return Str.trimLeadingDotSlash(input.trim()).replaceAll('\\', '/').replace(/\/$/, '');
}
