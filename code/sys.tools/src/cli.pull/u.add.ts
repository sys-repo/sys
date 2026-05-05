import { Fs, Str, type t, Url, Yaml } from './common.ts';
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

export async function addHttpBundle(input: PullAddInput): Promise<PullAddResult> {
  const yamlPath = resolveConfigPath(input.cwd, input.config);
  const bundle = resolveBundle(input.dist, input.local);
  const exists = await Fs.exists(yamlPath);

  const loaded = exists
    ? await PullFs.validateYaml(yamlPath)
    : { ok: true, doc: PullYamlSchema.initial() };
  if (!loaded.ok) throw new Error(`Pull add: invalid config: ${Fs.trimCwd(yamlPath)}`);

  const doc = cloneDoc(loaded.doc);
  const bundles = doc.bundles ?? [];
  const existing = bundles.find((item) => sameLocal(item.local.dir, bundle.local.dir));
  if (existing) {
    if (existing.kind === 'http' && sameDist(existing.dist, bundle.dist)) {
      return {
        kind: 'exists',
        yamlPath,
        createdConfig: false,
        bundle: existing,
      };
    }
    throw new Error(
      `Pull add: local target already used by a different bundle: ${bundle.local.dir}`,
    );
  }

  bundles.push(bundle);
  doc.bundles = bundles;

  if (input.dryRun === true) {
    return {
      kind: 'dry-run',
      yamlPath,
      createdConfig: !exists,
      bundle,
    };
  }

  const text = stringifyDoc(doc, yamlPath);
  await Fs.ensureDir(Fs.dirname(yamlPath));
  await Fs.write(yamlPath, text, { force: true });

  return {
    kind: 'added',
    yamlPath,
    createdConfig: !exists,
    bundle,
  };
}

/**
 * Helpers:
 */

function resolveConfigPath(cwd: t.StringDir, config: string): t.StringPath {
  const text = String(config ?? '').trim();
  if (!text) throw new Error('Pull add: missing required flag: --config');
  return Fs.resolve(cwd, text) as t.StringPath;
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
      ? { ...doc.defaults, local: doc.defaults.local ? { ...doc.defaults.local } : undefined }
      : undefined,
    bundles: doc.bundles?.map((bundle) => ({
      ...bundle,
      local: { ...bundle.local },
    })),
  };
}

function stringifyDoc(doc: t.PullTool.ConfigYaml.Doc, yamlPath: t.StringPath): string {
  const yaml = Yaml.stringify(doc);
  if (yaml.error || !yaml.data) {
    throw new Error(`Pull add: failed to stringify config: ${Fs.trimCwd(yamlPath)}`);
  }

  const checked = validatePullYamlText(yaml.data);
  if (!checked.ok) throw new Error(`Pull add: generated invalid config: ${Fs.trimCwd(yamlPath)}`);
  return yaml.data;
}

function sameLocal(a: string, b: string): boolean {
  return Str.trimLeadingDotSlash(a.trim()) === Str.trimLeadingDotSlash(b.trim());
}

function sameDist(a: string, b: string): boolean {
  return a.trim() === b.trim();
}
