import { type t } from './common.ts';
import { errorMessage, fail } from './u.result.ts';
import { pullGithubReleaseBundle } from '../u.pull.github/u.release.ts';
import { pullGithubRepoBundle } from '../u.pull.github/u.repo.ts';
import { pullHttpBundle } from './u.pull.http.ts';

type PullHttp = (
  baseDir: t.StringDir,
  bundle: t.PullTool.ConfigYaml.HttpBundle,
) => Promise<t.PullToolRemoteBundleResult>;
type PullGithubRelease = (
  baseDir: t.StringDir,
  bundle: t.PullTool.ConfigYaml.GithubReleaseBundle,
) => Promise<t.PullToolRemoteBundleResult>;
type PullGithubRepo = (
  baseDir: t.StringDir,
  bundle: t.PullTool.ConfigYaml.GithubRepoBundle,
) => Promise<t.PullToolRemoteBundleResult>;
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
): Promise<t.PullToolRemoteBundleResult> {
  try {
    if (bundle.kind === 'http') return await pullers.pullHttp(baseDir, bundle);
    if (bundle.kind === 'github:release') return await pullers.pullGithubRelease(baseDir, bundle);
    if (bundle.kind === 'github:repo') return await pullers.pullGithubRepo(baseDir, bundle);
    const _never: never = bundle;
    return fail(`Unknown bundle kind: ${String(_never)}`);
  } catch (error) {
    return fail(errorMessage(error));
  }
}
