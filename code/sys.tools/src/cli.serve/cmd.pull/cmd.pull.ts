import { type t, c, Cli, done, Fs, Url } from '../common.ts';
import { Config } from '../u.config.ts';
import { Fmt as BaseFmt } from '../u.fmt.ts';
import { pullRemoteBundle } from './u.pull.ts';
import { toDistUrl, validateDistUrl } from './u.ts';

type C = t.ServeTool.Command;

export const stripHttp = (value: string): string => value.replace(/^https?:\/\//, '');

const Fmt = {
  ...BaseFmt,
  distUrl(url: t.StringUrl) {
    url = stripHttp(url);
    const i = url.lastIndexOf('/');
    return url.slice(0, i) + c.dim(url.slice(i));
  },
} as const;

export async function pullBundle(
  cwd: t.StringDir,
  location: t.ServeTool.DirConfig,
): Promise<t.RunReturn> {
  const config = await Config.get(cwd);
  const opt = (name: string, value: C) => ({ name, value });

  const PULL_PREFIX = 'bundle:pull-latest:';
  const optBundles = (location.remoteBundles ?? []).map((m, i, total) => {
    const branch = Fmt.Tree.branch([i, total]);
    const name = `${' pull:'} ${branch} ${m.local.dir} ← ${Fmt.distUrl(m.remote.dist)}`;
    const value = `${PULL_PREFIX}${i}`;
    return { name, value };
  });

  const A = (await Cli.Prompt.Select.prompt<C>({
    message: 'Action:',
    options: [
      //
      ...optBundles,
      opt('  add: <remote>', 'bundle:add-remote'),
    ],
  })) as C;

  if (A === 'exit') return done(0);

  if (A === 'bundle:add-remote') {
    const B = await Cli.Prompt.Input.prompt({
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

    const localDir = await Cli.Prompt.Input.prompt({
      message: 'Local subdirectory',
      async validate(input) {
        const spinner = Cli.spinner(Fmt.spinnerText('validating path...'));
        const res = await validateSubdir(input, location);
        spinner.stop();
        return res;
      },
    });

    // Write to the config file.
    config.change((d) => {
      const { bundle } = Config.Mutate.getRemoteBundle(d, location.dir, distUrl.href, localDir);
      if (!bundle) throw new Error(`Expected a bundle entry. ${distUrl.href}`);
      bundle.remote.dist = distUrl.href;
      bundle.local.dir = localDir;
    });

    if (config.fs.pending) await config.fs.save();

    // Re-load menu, with fresh copy of the adjusted config.
    return pullBundle(cwd, Config.findLocation(config.current, location.dir)!);
  }

  if (A.startsWith(PULL_PREFIX)) {
    const index = Number(A.slice(PULL_PREFIX.length));
    const loc = Config.findLocation(config.current, location.dir) ?? location;
    const bundles = loc.remoteBundles ?? [];
    const bundle = bundles[index];
    if (!bundle) throw new Error(`Expected a bundle entry. index: ${index}`);

    await pullRemoteBundle(location.dir, bundle);
    return done(0);
  }

  return done(0);
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

export async function validateSubdir(input: string, location: t.ServeTool.DirConfig) {
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
