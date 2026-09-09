import type { t } from './common.ts';
import { pullGithubReleaseBundle } from '../u.pull.github/u.release.ts';
import { pullGithubRepoBundle } from '../u.pull.github/u.repo.ts';
import { pullDistBundle } from './u.pull.dist.ts';

type PullDist = (
  baseDir: t.StringDir,
  bundle: t.PullTool.ConfigYaml.DistBundle,
  options?: t.PullTool.Bundle.RunOptions,
) => Promise<t.PullTool.Bundle.Dist.Result>;
type PullGithubRelease = (
  baseDir: t.StringDir,
  bundle: t.PullTool.ConfigYaml.GithubReleaseBundle,
  options?: t.PullTool.Bundle.RunOptions,
) => Promise<t.GithubPull.Outcome>;
type PullGithubRepo = (
  baseDir: t.StringDir,
  bundle: t.PullTool.ConfigYaml.GithubRepoBundle,
  options?: t.PullTool.Bundle.RunOptions,
) => Promise<t.GithubPull.Outcome>;
type Pullers = {
  pullDist: PullDist;
  pullGithubRelease: PullGithubRelease;
  pullGithubRepo: PullGithubRepo;
};

export type RemoteBundleResult = t.PullTool.Bundle.Dist.Result | t.GithubPull.Outcome;

/** Pull one configured remote bundle into its explicit local target. */
export async function pullRemoteBundle(
  baseDir: t.StringDir,
  bundle: t.PullTool.ConfigYaml.Bundle,
  pullers: Pullers = {
    pullDist: pullDistBundle,
    pullGithubRelease: pullGithubReleaseBundle,
    pullGithubRepo: pullGithubRepoBundle,
  },
  options: t.PullTool.Bundle.RunOptions = {},
): Promise<RemoteBundleResult> {
  try {
    if (bundle.kind === 'dist') return await pullers.pullDist(baseDir, bundle, options);
    if (bundle.kind === 'github:release') {
      return await pullers.pullGithubRelease(baseDir, bundle, options);
    }
    if (bundle.kind === 'github:repo') {
      return await pullers.pullGithubRepo(baseDir, bundle, options);
    }
    const _never: never = bundle;
    throw new Error(`Unknown bundle kind: ${String(_never)}`);
  } catch (error) {
    if (bundle.kind === 'dist') throw error;
    return {
      ok: false,
      kind: 'source-failure',
      error: 'GitHub pull failed.',
      files: [],
    };
  }
}
