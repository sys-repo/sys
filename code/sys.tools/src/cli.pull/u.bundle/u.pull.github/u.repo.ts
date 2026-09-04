import { c, Cli, Fs, type t } from './common.ts';
import { Fmt } from '../../u.fmt.ts';
import { loadGithubToken } from '../../u.github/u.client.ts';
import { GithubPull } from '../../u.github/u.pull.ts';

export async function pullGithubRepoBundle(
  baseDir: t.StringDir,
  bundle: t.PullTool.ConfigYaml.GithubRepoBundle,
  options: t.PullTool.Bundle.RunOptions = {},
): Promise<t.GithubPull.Outcome> {
  const spinner = options.silent ? undefined : Cli.spinner();
  try {
    spinner?.start(Fmt.spinnerText('pulling github repo...'));
    const token = await loadGithubToken({ cwd: baseDir });
    const result = await GithubPull.repo({
      repo: bundle.repo,
      ref: bundle.ref,
      path: bundle.path,
      into: Fs.join(baseDir, bundle.local.dir) as t.StringDir,
      mode: bundle.local.mode,
      limits: bundle.limits,
      token,
      until: options.until,
    });

    if (result.ok) {
      const msg = `${c.green('repo pulled')} → ${
        c.cyan(bundle.local.dir)
      } (${result.files.length} files)`;
      spinner?.succeed(Fmt.spinnerText(c.gray(msg)));
    } else {
      spinner?.fail(Fmt.spinnerText(result.error));
    }
    return result;
  } finally {
    spinner?.stop();
  }
}
