import { type t } from './common.ts';
import { errorMessage, fail } from './u.result.ts';
import { pullGithubReleaseBundle } from '../u.pull.github/u.release.ts';
import { pullGithubRepoBundle } from '../u.pull.github/u.repo.ts';
import { pullHttpBundle } from './u.pull.http.ts';

type PullHttp = (
  baseDir: t.StringDir,
  bundle: t.PullTool.ConfigYaml.HttpBundle,
  options?: t.PullTool.Bundle.RunOptions,
) => Promise<t.PullTool.Bundle.Remote.Result>;
type PullGithubRelease = (
  baseDir: t.StringDir,
  bundle: t.PullTool.ConfigYaml.GithubReleaseBundle,
  options?: t.PullTool.Bundle.RunOptions,
) => Promise<t.PullTool.Bundle.Remote.Result>;
type PullGithubRepo = (
  baseDir: t.StringDir,
  bundle: t.PullTool.ConfigYaml.GithubRepoBundle,
  options?: t.PullTool.Bundle.RunOptions,
) => Promise<t.PullTool.Bundle.Remote.Result>;
type Pullers = {
  pullHttp: PullHttp;
  pullGithubRelease: PullGithubRelease;
  pullGithubRepo: PullGithubRepo;
};

/**
 * Pulls a remote bundle into a local directory.
 * Supports `http`, `github:release`, and `github:repo` pull kinds.
 */
export async function pullRemoteBundle(
  baseDir: t.StringDir,
  bundle: t.PullTool.ConfigYaml.Bundle,
  pullers: Pullers = {
    pullHttp: pullHttpBundle,
    pullGithubRelease: pullGithubReleaseBundle,
    pullGithubRepo: pullGithubRepoBundle,
  },
  options: t.PullTool.Bundle.RunOptions = {},
): Promise<t.PullTool.Bundle.Remote.Result> {
  try {
    if (bundle.kind === 'http') return await pullers.pullHttp(baseDir, bundle, options);
    if (bundle.kind === 'github:release') {
      return await pullers.pullGithubRelease(baseDir, bundle, options);
    }
    if (bundle.kind === 'github:repo') {
      return await pullers.pullGithubRepo(baseDir, bundle, options);
    }
    const _never: never = bundle;
    return fail(`Unknown bundle kind: ${String(_never)}`);
  } catch (error) {
    return fail(errorMessage(error));
  }
}
