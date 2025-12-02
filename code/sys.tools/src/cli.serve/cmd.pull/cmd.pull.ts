import { type t, c, Cli, done, Fs, getConfig, Url } from '../common.ts';
import { Config } from '../u.config.ts';
import { Fmt } from '../u.fmt.ts';
import { pullRemoteBundle } from './u.pull.ts';
import { toDistUrl, validateDistUrl } from './u.ts';

type C = t.ServeTool.Command;

export async function pullBundle(
  cwd: t.StringDir,
  location: t.ServeTool.DirConfig,
): Promise<t.RunReturn> {
  const config = await getConfig(cwd);
  const opt = (name: string, value: C) => ({ name, value });

  const PULL_PREFIX = 'bundle:pull-latest:';
  const optBundles = (location.remoteBundles ?? []).map((m, i, total) => {
    const branch = Fmt.Tree.branch([i, total]);
    let name = `${' pull:'} ${branch} ${m.remote.dist}`;
    const value = `${PULL_PREFIX}${m.remote.dist}`;
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
      message: `Remote ${c.cyan('dist.json')} url`,
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
      const { bundle } = Config.Mutate.getRemoteBundle(d, location.dir, distUrl.href);
      if (!bundle) throw new Error(`Expected a bundle entry. ${distUrl.href}`);
      bundle.remote.dist = distUrl.href;
      bundle.local.dir = localDir;
    });

    if (config.fs.pending) await config.fs.save();
    return pullBundle(cwd, Config.findLocation(config, location.dir)!);
  }

  if (A.startsWith(PULL_PREFIX)) {
    const distUrl = A.slice(PULL_PREFIX.length);
    const bundle = Config.findBundle(config, location.dir, distUrl);
    if (!bundle) throw new Error(`Expected a bundle entry. ${distUrl}`);
    await pullRemoteBundle(location.dir, bundle);
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
