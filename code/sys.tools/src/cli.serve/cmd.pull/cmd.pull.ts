import { type t, c, Cli, Fs, opt, Str, Time, Url, Yaml } from '../common.ts';
import { Fmt as BaseFmt } from '../u.fmt.ts';
import { ServeFs } from '../u.yaml/mod.ts';
import { pullRemoteBundle } from './u.pull.ts';
import { toDistUrl, validateDistUrl } from './u.ts';

type C = t.ServeTool.Command;
type PullResult =
  | { readonly kind: 'back' }
  | { readonly kind: 'bundle'; readonly bundle?: t.ServeTool.LocationYaml.RemoteBundle };

const Fmt = {
  ...BaseFmt,
  distUrl(url: t.StringUrl) {
    url = Str.trimHttpScheme(url);
    const i = url.lastIndexOf('/');
    return url.slice(0, i) + c.dim(url.slice(i));
  },
} as const;

export async function pullBundle(
  cwd: t.StringDir,
  yamlPath: t.StringPath,
  location: t.ServeTool.LocationYaml.Location,
): Promise<PullResult> {
  const done = (bundle?: t.ServeTool.LocationYaml.RemoteBundle): PullResult => ({
    kind: 'bundle',
    bundle,
  });

  const PULL_PREFIX = 'bundle:pull-latest:';
  const bundles = location.remoteBundles ?? [];
  const optBundles = bundles.map((m, i, total) => {
    const branch = Fmt.Tree.branch([i, total]);
    const name = `${'  pull:'} ${branch} ${m.local.dir} ← ${Fmt.distUrl(m.remote.dist)}`;
    const value = `${PULL_PREFIX}${i}`;
    return { name, value };
  });

  const dim = (s: string) => c.gray(c.dim(s));
  const A = (await Cli.Input.Select.prompt<C>({
    message: 'Action:',
    options: [
      ...optBundles,
      opt('   add: <remote>', 'bundle:add-remote'),
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
    const newBundle: t.ServeTool.LocationYaml.RemoteBundle = {
      remote: { dist: distUrl.href },
      local: { dir: localDir as t.StringRelativeDir },
    };

    await updateYamlBundles(yamlPath, (bundles) => {
      const existing = bundles.find(
        (m) => m.remote.dist === distUrl.href && m.local.dir === localDir,
      );
      if (!existing) bundles.push(newBundle);
    });

    // Re-load location and recurse.
    const loaded = await ServeFs.loadLocation(yamlPath);
    if (!loaded.ok) return done();
    return pullBundle(cwd, yamlPath, loaded.location);
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
  mutate: (bundles: t.ServeTool.LocationYaml.RemoteBundle[]) => void,
) {
  const read = await Fs.readText(yamlPath);
  if (!read.ok || !read.data) return;

  const parsed = Yaml.parse<t.ServeTool.LocationYaml.Doc>(read.data);
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
  location: t.ServeTool.LocationYaml.Location,
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
