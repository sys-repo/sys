import { Fs, Str, type t, Url, Yaml, YamlConfig } from './common.ts';
import { toDistUrl } from './u.bundle/u.ts';
import { PullFs, PullYamlSchema, validatePullYamlText } from './u.yaml/mod.ts';

export type PullAddInput = {
  readonly cwd: t.StringDir;
  readonly config: string;
  readonly dist: string;
  readonly local: string;
  readonly dryRun?: boolean;
};

export type PullAddResult = {
  readonly kind: 'added' | 'exists' | 'dry-run';
  readonly yamlPath: t.StringPath;
  readonly createdConfig: boolean;
  readonly bundle: t.PullTool.ConfigYaml.HttpBundle;
};

type PullAddChange = {
  readonly kind: 'added' | 'exists';
  readonly bundle: t.PullTool.ConfigYaml.HttpBundle;
};

export async function addHttpBundle(input: PullAddInput): Promise<PullAddResult> {
  const bundle = resolveBundle(input.dist, input.local);
  const edit = await YamlConfig.Edit.update<t.PullTool.ConfigYaml.Doc, PullAddChange>({
    cwd: input.cwd,
    config: requireConfig(input.config),
    dryRun: input.dryRun,
    initial: () => PullYamlSchema.initial(),
    load: loadConfig,
    mutate: (doc) => addBundle(doc, bundle),
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
  source: t.PullTool.ConfigYaml.Doc,
  bundle: t.PullTool.ConfigYaml.HttpBundle,
): t.YamlConfig.Edit.Mutation<t.PullTool.ConfigYaml.Doc, PullAddChange> {
  const doc = cloneDoc(source);
  const bundles = doc.bundles ?? [];
  const existing = bundles.find((item) => sameLocal(item.local.dir, bundle.local.dir));

  if (existing) {
    if (existing.kind === 'http' && sameDist(existing.dist, bundle.dist)) {
      return { doc, changed: false, change: { kind: 'exists', bundle: existing } };
    }
    throw new Error(
      `Pull add: local target already used by a different bundle: ${bundle.local.dir}`,
    );
  }

  bundles.push(bundle);
  doc.bundles = bundles;
  return { doc, changed: true, change: { kind: 'added', bundle } };
}

function resolveBundle(dist: string, local: string): t.PullTool.ConfigYaml.HttpBundle {
  const parsed = Url.toCanonical(toDistUrl(dist));
  if (!parsed.ok) throw new Error('Pull add: --dist must be a valid dist URL.');

  return {
    kind: 'http',
    dist: parsed.href,
    local: { dir: normalizeLocalDir(local) },
  };
}

function normalizeLocalDir(input: string): t.StringRelativeDir {
  const text = String(input ?? '').trim();
  if (!text) throw new Error('Pull add: missing required flag: --local');
  if (text.startsWith('/')) throw new Error('Pull add: --local must be relative.');
  if (text.startsWith('~')) {
    throw new Error('Pull add: --local must be relative to the config root.');
  }

  const normalized = Str.trimLeadingDotSlash(text);
  if (normalized === '.' || normalized === '') {
    throw new Error('Pull add: --local must be a child directory under the config root.');
  }
  if (
    normalized === '..' ||
    normalized.startsWith('../') ||
    normalized.endsWith('/..') ||
    normalized.includes('/../')
  ) {
    throw new Error('Pull add: --local must not traverse outside the config root.');
  }

  return text as t.StringRelativeDir;
}

function cloneDoc(doc: t.PullTool.ConfigYaml.Doc): t.PullTool.ConfigYaml.Doc {
  return {
    ...doc,
    defaults: doc.defaults
      ? { ...doc.defaults, http: doc.defaults.http ? { ...doc.defaults.http } : undefined }
      : undefined,
    bundles: doc.bundles?.map((bundle) => {
      if (bundle.kind === 'http') return { ...bundle, local: { ...bundle.local } };
      return { ...bundle, local: { ...bundle.local }, limits: { ...bundle.limits } };
    }),
  };
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

function sameLocal(a: string, b: string): boolean {
  return Str.trimLeadingDotSlash(a.trim()) === Str.trimLeadingDotSlash(b.trim());
}

function sameDist(a: string, b: string): boolean {
  return a.trim() === b.trim();
}
