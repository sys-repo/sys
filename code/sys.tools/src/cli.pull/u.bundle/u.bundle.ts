import { c, Cli, Fs, Is, Open, opt, Str, type t, Url, Yaml } from '../common.ts';
import { Fmt as BaseFmt } from '../u.fmt.ts';
import { PullFs } from '../u.yaml/mod.ts';
import { validateBundleIsolation } from './u.isolation.ts';
import { pullRemoteBundle, type RemoteBundleResult } from './u.pull/mod.ts';

type C = t.PullTool.MenuCmd;
type PullResult =
  | { readonly kind: 'back' }
  | { readonly kind: 'bundle'; readonly bundle?: t.PullTool.ConfigYaml.Bundle };

type ExecuteBundlePullResult =
  | {
    readonly ok: true;
    readonly bundle: t.PullTool.ConfigYaml.Bundle;
    readonly data: t.PullTool.Bundle.Dist.Success | t.GithubPull.Success;
  }
  | { readonly ok: false; readonly error: string };

const Fmt = {
  ...BaseFmt,
  distUrl(url: t.StringUrl) {
    url = Str.trimHttpScheme(url);
    const i = url.lastIndexOf('/');
    return url.slice(0, i) + c.dim(url.slice(i));
  },
} as const;

const ValidConfigName = {
  hint: 'letters, numbers, ".", "_" or "-"',
  test(value: string) {
    return /^[a-zA-Z0-9]+([._-][a-zA-Z0-9]+)*$/.test(value);
  },
} as const;

const PULL_PREFIX = 'bundle:materialize:';

const bundleSourceLabel = (bundle: t.PullTool.ConfigYaml.Bundle): string => {
  if (bundle.kind === 'dist') return Fmt.distUrl(bundle.manifest);

  if (bundle.kind === 'github:release') {
    if (Array.isArray(bundle.asset)) {
      return c.magenta(c.italic(`github:release (${bundle.asset.length} assets)`));
    }
    if (Is.str(bundle.asset) && bundle.asset.trim()) {
      return c.magenta(c.italic(`github:release (${bundle.asset.trim()})`));
    }
    return c.magenta(c.italic('github:release (all assets)'));
  }

  if (bundle.kind === 'github:repo') {
    const ref = bundle.ref?.trim() ? ` @ ${bundle.ref.trim()}` : '';
    const path = bundle.path?.trim() ? `:${bundle.path.trim()}` : '';
    return c.magenta(c.italic(`github:repo ${bundle.repo}${ref}${path}`));
  }

  const _never: never = bundle;
  return c.gray(c.dim(String(_never)));
};

export function formatBundleOptionLocalDirWidth(
  bundles: readonly t.PullTool.ConfigYaml.Bundle[],
): number {
  return bundles.reduce((acc, bundle) => {
    return Math.max(acc, bundleOptionLocalDirText(bundleTargetDir(bundle)).length);
  }, 0);
}

export function formatBundleOptionName(
  bundle: t.PullTool.ConfigYaml.Bundle,
  index: number,
  bundles: readonly t.PullTool.ConfigYaml.Bundle[],
  localDirWidth = formatBundleOptionLocalDirWidth(bundles),
): string {
  const branch = Fmt.Tree.branch([index, bundles]);
  const localDir = bundleOptionLocalDirLabel(bundleTargetDir(bundle), localDirWidth);
  const source = bundleSourceLabel(bundle);
  return `${'  pull:'} ${branch} ${localDir} ${c.gray('←')} ${source}`;
}

export async function pullBundle(
  _cwd: t.StringDir,
  yamlPath: t.StringPath,
  location: t.PullTool.ConfigYaml.Location,
): Promise<PullResult> {
  const done = (bundle?: t.PullTool.ConfigYaml.Bundle): PullResult => ({
    kind: 'bundle',
    bundle,
  });

  const bundles = location.bundles ?? [];
  const localDirWidth = formatBundleOptionLocalDirWidth(bundles);
  const optBundles = bundles.map((bundle, index, all) => {
    const name = formatBundleOptionName(bundle, index, all, localDirWidth);
    const value = `${PULL_PREFIX}${index}`;
    return { name, value };
  });

  const A = (await Cli.Input.Select.prompt<C>({
    message: 'Action:',
    options: [
      ...optBundles,
      opt('   add: <pinned-dist>', 'bundle:add-dist'),
      opt('config: edit', 'config:edit'),
      opt('config: rename', 'config:rename'),
      opt(Fmt.back(), 'back'),
    ],
  })) as C;

  if (A === 'back') return { kind: 'back' };
  if (A === 'exit') return done();

  if (A === 'bundle:add-dist') {
    const manifestInput = await Cli.Input.Text.prompt({
      message: `Pinned ${c.italic('dist.json')} URL`,
      validate: validateManifestInput,
    });
    const manifest = parseManifestUrl(manifestInput);
    if (!manifest) throw new Error('Expected an absolute HTTP(S) manifest URL.');

    const integrity = await Cli.Input.Text.prompt({
      message: 'Publisher-provided manifest SHA-256',
      validate: validateIntegrityInput,
    });
    const store = await Cli.Input.Text.prompt({
      message: 'Immutable store subdirectory',
      validate: validateRelativeDir,
    });
    const projectInput = await Cli.Input.Text.prompt({
      message: 'Mutable projection subdirectory (optional)',
      default: '',
      validate: (input) => input.trim() ? validateRelativeDir(input) : true,
    });
    const projectDir = projectInput.trim();
    const project = projectDir
      ? {
        dir: projectDir as t.StringRelativeDir,
        mode: (await Cli.Input.Select.prompt<t.GithubPull.Mode>({
          message: 'Projection mutation mode',
          options: [
            { name: 'create', value: 'create' },
            { name: 'replace', value: 'replace' },
          ],
        })) as t.GithubPull.Mode,
      }
      : undefined;

    const newBundle: t.PullTool.ConfigYaml.DistBundle = {
      kind: 'dist',
      manifest,
      integrity: integrity.trim() as t.StringHash,
      store: store.trim() as t.StringRelativeDir,
      project,
    };
    const isolation = validateBundleIsolation({
      ...location,
      bundles: [...bundles, newBundle],
    });
    if (!isolation.ok) throw new Error(isolation.error);

    await updateYamlBundles(yamlPath, (current) => {
      if (!current.some((item) => item.kind === 'dist' && sameDistBundle(item, newBundle))) {
        current.push(newBundle);
      }
    });

    const loaded = await PullFs.loadLocation(yamlPath);
    if (!loaded.ok) return done();
    return pullBundle(_cwd, yamlPath, loaded.location);
  }

  if (A === 'config:edit') {
    const openTarget = Fs.Path.trimCwd(yamlPath, { cwd: _cwd, prefix: true });
    Open.invokeDetached(_cwd, openTarget.length > 0 ? openTarget : yamlPath, { silent: true });
    return pullBundle(_cwd, yamlPath, location);
  }

  if (A === 'config:rename') {
    const current = Fs.basename(yamlPath).slice(0, -PullFs.ext.length);
    const raw = await Cli.Input.Text.prompt({
      message: 'Config name',
      default: current,
      validate(value) {
        const next = String(value ?? '').trim();
        if (!next) return 'Name required.';
        if (!ValidConfigName.test(next)) return ValidConfigName.hint;
        if (next === current) return true;
        const path = Fs.join(Fs.dirname(yamlPath), `${next}${PullFs.ext}`);
        return Fs.exists(path).then((exists) => (exists ? 'Name already exists.' : true));
      },
    });

    const next = raw.trim();
    if (next === current) return pullBundle(_cwd, yamlPath, location);

    const nextPath = Fs.join(Fs.dirname(yamlPath), `${next}${PullFs.ext}`);
    await Fs.ensureDir(Fs.dirname(nextPath));
    await Fs.move(yamlPath, nextPath);

    const loaded = await PullFs.loadLocation(nextPath);
    if (!loaded.ok) return { kind: 'back' };
    return pullBundle(_cwd, nextPath, loaded.location);
  }

  if (A.startsWith(PULL_PREFIX)) {
    const index = Number(A.slice(PULL_PREFIX.length));
    const bundle = bundles[index];
    if (!bundle) throw new Error(`Expected a bundle entry. index: ${index}`);
    const pulled = await pullBundleWithSummary(yamlPath, location, bundle);
    if (!pulled.ok) {
      console.info(Fmt.pullError(pulled.error));
      return pullBundle(_cwd, yamlPath, location);
    }

    return done(pulled.bundle);
  }

  return done();
}

export async function pullBundleWithSummary(
  _yamlPath: t.StringPath,
  location: t.PullTool.ConfigYaml.Location,
  bundle: t.PullTool.ConfigYaml.Bundle,
): Promise<ExecuteBundlePullResult> {
  const pulled = await pullConfiguredBundle(location, bundle);
  if (!pulled.ok) return pulled;

  console.info(Fmt.pullSummary({ bundle: pulled.bundle, data: pulled.data }));

  return pulled;
}

export async function pullConfiguredBundle(
  location: t.PullTool.ConfigYaml.Location,
  bundle: t.PullTool.ConfigYaml.Bundle,
  options: t.PullTool.Bundle.RunOptions = {},
): Promise<ExecuteBundlePullResult> {
  const isolation = validateBundleIsolation(location);
  if (!isolation.ok) return isolation;

  const pulled = await pullRemoteBundle(location.dir, bundle, undefined, options);
  if (bundle.kind === 'dist') {
    if (!isDistResult(pulled)) {
      return { ok: false, error: 'Dist bundle returned a GitHub result.' };
    }
    if (!pulled.ok) {
      if (pulled.kind === 'materialization-failed') {
        return {
          ok: false,
          error:
            `Dist materialization failed: ${pulled.generation.stage}/${pulled.generation.reason}`,
        };
      }
      return { ok: false, error: pulled.projection.error };
    }
    return { ok: true, bundle, data: pulled };
  }

  if (isDistResult(pulled)) return { ok: false, error: 'GitHub bundle returned a Dist result.' };
  if (!pulled.ok) return { ok: false, error: pulled.error };
  return { ok: true, bundle, data: pulled };
}

/**
 * Read YAML, update bundles, write back.
 */
async function updateYamlBundles(
  yamlPath: t.StringPath,
  mutate: (bundles: t.PullTool.ConfigYaml.Bundle[]) => void,
) {
  const read = await Fs.readText(yamlPath);
  if (!read.ok || !read.data) return;

  const parsed = Yaml.parse<t.PullTool.ConfigYaml.Doc>(read.data);
  if (parsed.error || !parsed.data) return;

  const doc = parsed.data;
  doc.bundles = doc.bundles ?? [];
  mutate(doc.bundles);

  const yaml = Yaml.stringify(doc);
  if (yaml.error || !yaml.data) return;
  await Fs.write(yamlPath, yaml.data);
}

/**
 * Helpers:
 */
function isDistResult(result: RemoteBundleResult): result is t.PullTool.Bundle.Dist.Result {
  if (!('kind' in result)) return false;
  return result.kind === 'dist' || result.kind === 'materialization-failed' ||
    result.kind === 'projection-failed';
}

function bundleTargetDir(bundle: t.PullTool.ConfigYaml.Bundle): t.StringRelativeDir {
  return bundle.kind === 'dist' ? bundle.project?.dir ?? bundle.store : bundle.local.dir;
}

function bundleOptionLocalDirText(dir: string): string {
  const relative = Str.trimLeadingDotSlash(dir);
  if (!relative || relative === '.') return './';
  return `./${relative}`;
}

function bundleOptionLocalDirLabel(dir: string, width: number): string {
  const text = bundleOptionLocalDirText(dir);
  const rest = text.slice(2);
  const label = rest ? `${c.gray('./')}${c.cyan(rest)}` : c.gray('./');
  const pad = ' '.repeat(Math.max(0, width - text.length));
  return `${label}${pad}`;
}

function validateManifestInput(input: string): true | string {
  return parseManifestUrl(input) ? true : 'Enter an absolute HTTP(S) URL without userinfo.';
}

function parseManifestUrl(input: string): t.StringUrl | undefined {
  const text = input.trim();
  if (!Is.urlString(text)) return;
  const parsed = Url.parse(text);
  if (!parsed.ok) return;
  const url = parsed.toURL();
  if (url.username || url.password) return;
  url.hash = '';
  return url.href as t.StringUrl;
}

function validateIntegrityInput(input: string): true | string {
  return /^sha256-[0-9a-f]{64}$/.test(input.trim())
    ? true
    : 'Enter the canonical publisher-provided sha256- integrity.';
}

function validateRelativeDir(input: string): true | string {
  const text = input.trim();
  const normalized = Str.trimLeadingDotSlash(text).replaceAll('\\', '/');
  if (
    !normalized ||
    normalized === '.' ||
    normalized === '..' ||
    normalized.startsWith('../') ||
    normalized.endsWith('/..') ||
    normalized.includes('/../') ||
    normalized.split('/').some((part) => part === '.') ||
    text.startsWith('/') ||
    text.startsWith('~') ||
    /^[A-Za-z]:/.test(text)
  ) {
    return 'Enter a child directory relative to the config root.';
  }
  return true;
}

function sameDistBundle(
  a: t.PullTool.ConfigYaml.DistBundle,
  b: t.PullTool.ConfigYaml.DistBundle,
): boolean {
  return a.manifest === b.manifest && a.integrity === b.integrity && a.store === b.store &&
    a.project?.dir === b.project?.dir && a.project?.mode === b.project?.mode;
}
