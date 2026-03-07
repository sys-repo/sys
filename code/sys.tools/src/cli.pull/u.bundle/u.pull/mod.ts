import type { t } from '../../common.ts';
import { errorMessage, fail } from './common.ts';
import { pullGithubReleaseBundle } from './u.pull.github.ts';
import { pullHttpBundle } from './u.pull.http.ts';

type PullHttp = (
  baseDir: t.StringDir,
  bundle: t.PullTool.ConfigYaml.HttpBundle,
) => Promise<t.PullToolRemoteBundleResult>;
type PullGithubRelease = (
  baseDir: t.StringDir,
  bundle: t.PullTool.ConfigYaml.GithubReleaseBundle,
) => Promise<t.PullToolRemoteBundleResult>;
type Pullers = {
  pullHttp: PullHttp;
  pullGithubRelease: PullGithubRelease;
};

/**
 * Pulls a remote bundle into a local directory.
 * Supports `http` and `github:release` pull kinds.
 */
export async function pullRemoteBundle(
  baseDir: t.StringDir,
  bundle: t.PullTool.ConfigYaml.Bundle,
  pullers: Pullers = {
    pullHttp: pullHttpBundle,
    pullGithubRelease: pullGithubReleaseBundle,
  },
): Promise<t.PullToolRemoteBundleResult> {
  try {
    if (bundle.kind === 'http') return pullers.pullHttp(baseDir, bundle);
    if (bundle.kind === 'github:release') return pullers.pullGithubRelease(baseDir, bundle);
    const _never: never = bundle;
    return fail(`Unknown bundle kind: ${String(_never)}`);
  } catch (error) {
    return fail(errorMessage(error));
  }
}
