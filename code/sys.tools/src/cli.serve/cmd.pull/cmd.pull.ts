import { type t, c, Cli, Fs, opt, Str, Url } from '../common.ts';
import { Config } from '../u.config.ts';
import { Fmt as BaseFmt } from '../u.fmt.ts';
import { pullRemoteBundle } from './u.pull.ts';
import { toDistUrl, validateDistUrl } from './u.ts';

type C = t.ServeTool.Command;
type R = { bundle?: t.ServeTool.Config.RemoteBundleDir };

const Fmt = {
  ...BaseFmt,
  distUrl(url: t.StringUrl) {
    url = Str.trimHttpScheme(url);
    const i = url.lastIndexOf('/');
    return url.slice(0, i) + c.dim(url.slice(i));
  },
} as const;

export async function pullBundle(cwd: t.StringDir, location: t.ServeTool.Config.Dir): Promise<R> {
  const config = await Config.get(cwd);

  // Stored key (portable) vs absolute dir (runtime):
  const locationKey = location.dir;
  const locationAbsDir = Config.resolveDir(cwd, location.dir);

  const done = (bundle?: t.ServeTool.Config.RemoteBundleDir) => ({ bundle });

  const PULL_PREFIX = 'bundle:pull-latest:';
  const optBundles = (location.remoteBundles ?? []).map((m, i, total) => {
    const branch = Fmt.Tree.branch([i, total]);
    const name = `${' pull:'} ${branch} ${m.local.dir} ← ${Fmt.distUrl(m.remote.dist)}`;
    const value = `${PULL_PREFIX}${i}`;
    return { name, value };
  });

  const A = (await Cli.Input.Select.prompt<C>({
    message: 'Action:',
    options: [
      //
      ...optBundles,
      opt('  add: <remote>', 'bundle:add-remote'),
    ],
  })) as C;

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
    if (!distUrl.ok) throw new Error(`Should be a valid URL.`); // NB: sanity check - should be a valid URL.

    const localDir = await Cli.Input.Text.prompt({
      message: 'Local subdirectory',
      async validate(input) {
        const spinner = Cli.spinner(Fmt.spinnerText('validating path...'));
        const res = await validateSubdir(input, { ...location, dir: locationAbsDir });
        spinner.stop();
        return res;
      },
    });

    // Write to the config file (create missing nodes if needed).
    config.change((d) => {
      d.dirs = d.dirs ?? [];

      let loc = Config.findLocation(d, locationKey);
      if (!loc) {
        // Create a minimal location entry (should be rare, but keeps the flow robust).
        loc = {
          createdAt: Date.now(),
          dir: locationKey,
          name: location.name,
          contentTypes: [...location.contentTypes],
          remoteBundles: [],
        };
        d.dirs.push(loc);
      }

      loc.remoteBundles = loc.remoteBundles ?? [];

      let bundle = loc.remoteBundles.find(
        (m) => m.remote.dist === distUrl.href && m.local.dir === localDir,
      );

      if (!bundle) {
        bundle = { remote: { dist: distUrl.href }, local: { dir: localDir } };
        loc.remoteBundles.push(bundle);
      }

      bundle.remote.dist = distUrl.href;
      bundle.local.dir = localDir;
    });

    if (config.fs.pending) await config.fs.save();

    // Re-load menu, with fresh copy of the adjusted config.
    return pullBundle(cwd, Config.findLocation(config.current, locationKey) ?? location);
  }

  if (A.startsWith(PULL_PREFIX)) {
    const index = Number(A.slice(PULL_PREFIX.length));
    const loc = Config.findLocation(config.current, locationKey) ?? location;
    const bundles = loc.remoteBundles ?? [];
    const bundle = bundles[index];
    if (!bundle) throw new Error(`Expected a bundle entry. index: ${index}`);
    await pullRemoteBundle(locationAbsDir, bundle);
    return done(bundle);
  }

  return done();
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

export async function validateSubdir(input: string, location: t.ServeTool.Config.Dir) {
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
