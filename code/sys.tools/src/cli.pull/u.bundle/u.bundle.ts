import { type t, c, Cli, Fs, Open, opt, Str, Time, Url, Yaml } from '../common.ts';
import { Fmt as BaseFmt } from '../u.fmt.ts';
import { PullFs } from '../u.yaml/mod.ts';
import { pullRemoteBundle } from './u.pull.ts';
import { toDistUrl, validateDistUrl } from './u.ts';

type C = t.PullTool.MenuCmd;
type PullResult =
  | { readonly kind: 'back' }
  | { readonly kind: 'bundle'; readonly bundle?: t.PullTool.ConfigYaml.RemoteBundle };

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

export async function pullBundle(
  _cwd: t.StringDir,
  yamlPath: t.StringPath,
  location: t.PullTool.ConfigYaml.Location,
): Promise<PullResult> {
  const done = (bundle?: t.PullTool.ConfigYaml.RemoteBundle): PullResult => ({
    kind: 'bundle',
    bundle,
  });

  const PULL_PREFIX = 'bundle:pull-latest:';
  const bundles = location.remoteBundles ?? [];
  const maxLocalDirWidth = bundles.reduce((acc, m) => Math.max(acc, m.local.dir.length), 0);
  const optBundles = bundles.map((m, i, total) => {
    const branch = Fmt.Tree.branch([i, total]);
    const localDir = c.cyan(m.local.dir.padEnd(maxLocalDirWidth, ' '));
    const name = `${'  pull:'} ${branch} ${localDir} ← ${Fmt.distUrl(m.remote.dist)}`;
    const value = `${PULL_PREFIX}${i}`;
    return { name, value };
  });

  const dim = (s: string) => c.gray(c.dim(s));
  const A = (await Cli.Input.Select.prompt<C>({
    message: 'Action:',
    options: [
      ...optBundles,
      opt('   add: <remote>', 'bundle:add-remote'),
      opt('config: edit', 'config:edit'),
      opt('config: rename', 'config:rename'),
      opt(dim('← back'), 'back'),
    ],
  })) as C;

  if (A === 'back') return { kind: 'back' };
  if (A === 'exit') return done();

  if (A === 'bundle:add-remote') {
    const B = await Cli.Input.Text.prompt({
      message: `Remote ${c.italic('dist.json')} url`,
      async validate(input) {
        const spinner = Cli.spinner(Fmt.spinnerText('validating url...'));
        const ok = await validateUrl(input);
        spinner.stop();
        return ok;
      },
    });

    const distUrl = Url.toCanonical(toDistUrl(B));
    if (!distUrl.ok) throw new Error(`Should be a valid URL.`);

    const localDir = await Cli.Input.Text.prompt({
      message: 'Local subdirectory',
      async validate(input) {
        const spinner = Cli.spinner(Fmt.spinnerText('validating path...'));
        const res = await validateSubdir(input, location);
        spinner.stop();
        return res;
      },
    });

    // Add the new bundle to the YAML file.
    const newBundle: t.PullTool.ConfigYaml.RemoteBundle = {
      remote: { kind: 'http', dist: distUrl.href },
      local: { dir: localDir as t.StringRelativeDir },
    };

    await updateYamlBundles(yamlPath, (bundles) => {
      const existing = bundles.find(
        (m) => m.remote.dist === distUrl.href && m.local.dir === localDir,
      );
      if (!existing) bundles.push(newBundle);
    });

    // Re-load location and recurse.
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

    await pullRemoteBundle(location.dir, bundle);

    // Update lastUsedAt in the YAML file.
    await updateYamlBundles(yamlPath, (list) => {
      const hit = list.find(
        (m) => m.remote.dist === bundle.remote.dist && m.local.dir === bundle.local.dir,
      );
      if (hit) hit.lastUsedAt = Time.now.timestamp;
    });

    return done(bundle);
  }

  return done();
}

/**
 * Read YAML, update bundles, write back.
 */
async function updateYamlBundles(
  yamlPath: t.StringPath,
  mutate: (bundles: t.PullTool.ConfigYaml.RemoteBundle[]) => void,
) {
  const read = await Fs.readText(yamlPath);
  if (!read.ok || !read.data) return;

  const parsed = Yaml.parse<t.PullTool.ConfigYaml.Doc>(read.data);
  if (parsed.error || !parsed.data) return;

  const doc = parsed.data;
  doc.remoteBundles = doc.remoteBundles ?? [];
  mutate(doc.remoteBundles);

  const yaml = Yaml.stringify(doc);
  if (yaml.error || !yaml.data) return;
  await Fs.write(yamlPath, yaml.data);
}

/**
 * Helpers:
 */
export async function validateUrl(input: string) {
  const url = toDistUrl(input);
  if (!url) return 'Enter a valid URL.';
  const result = await validateDistUrl(url.href);
  if (!result.ok) return result.error ?? 'Unable to load dist.json';
  return true;
}

export async function validateSubdir(
  input: string,
  location: t.PullTool.ConfigYaml.Location,
) {
  if (!input.trim()) return 'Cannot be empty';

  const target = Fs.join(location.dir, input);
  if (await Fs.exists(target)) return 'Directory already exists';

  const alreadyUsed = (location.remoteBundles ?? []).find((m) => m.local.dir === input);
  if (alreadyUsed) {
    const url = alreadyUsed.remote.dist;
    return `Directory name already been used by:\n  ${c.gray(c.italic(url))}`;
  }

  return true;
}
