import { Fmt } from '../../u.fmt.ts';
import {
  downloadGithubBlob,
  getGithubCommit,
  getGithubRepositoryMetadata,
  getGithubTree,
  loadGithubToken,
} from '../../u.github/u.client.ts';
import { mapGithubError } from '../../u.github/u.errors.ts';
import { resolveGithubRepoBundle } from '../../u.github/u.repo.resolve.ts';
import { done, errorMessage, fail } from '../u.pull/u.result.ts';
import { c, Cli, type t } from './common.ts';
import { executeGithubPullPlan } from './u.execute.ts';
import { createGithubRepoPullPlan } from './u.plan.ts';

export async function pullGithubRepoBundle(
  baseDir: t.StringDir,
  bundle: t.PullTool.ConfigYaml.GithubRepoBundle,
): Promise<t.PullToolRemoteBundleResult> {
  const spinner = Cli.spinner();
  const token = await loadGithubToken({ cwd: baseDir });
  let effectiveRef = bundle.ref?.trim() || '';

  try {
    spinner.start(Fmt.spinnerText('resolving github repo...'));

    if (!effectiveRef) {
      const metadata = await getGithubRepositoryMetadata({ repo: bundle.repo, token });
      effectiveRef = metadata.defaultBranch;
    }

    const commit = await getGithubCommit({ repo: bundle.repo, ref: effectiveRef, token });
    const tree = await getGithubTree({ repo: bundle.repo, treeSha: commit.treeSha, token });
    const resolved = resolveGithubRepoBundle({ bundle, ref: effectiveRef, commit, tree });
    if (!resolved.ok) return fail(resolved.error);

    const planned = createGithubRepoPullPlan({ baseDir, bundle, resolved: resolved.data });
    if (!planned.ok) return fail(planned.error);

    const executed = await executeGithubPullPlan({
      baseDir,
      plan: planned.plan,
      clear: bundle.local.clear,
      download: createGithubDownloader(token),
      events: {
        clearing: () => void (spinner.text = Fmt.spinnerText('clearing local target...')),
        entry({ entry, current, total }) {
          const progress = total > 1 ? ` ${c.white(String(current))}/${total}` : '';
          spinner.text = Fmt.spinnerText(`downloading${progress} ${c.cyan(entry.relativePath)}...`);
        },
      },
    });

    if (!executed.ok) return fail(executed.error);

    const total = executed.ops.length;
    const msgPulled = `${c.green('repo pulled')} → ${c.cyan(bundle.local.dir)} (${total} files)`;
    spinner.succeed(Fmt.spinnerText(c.gray(msgPulled)));

    return done({
      ok: true,
      ops: executed.ops,
      summary: {
        kind: 'github:repo',
        repo: resolved.data.repo,
        ref: resolved.data.ref,
        path: resolved.data.path,
      },
    });
  } catch (error) {
    const auth = mapGithubError(error, {
      kind: 'github:repo',
      repo: bundle.repo,
      ref: effectiveRef || bundle.ref,
      path: bundle.path,
    });
    return fail(auth ?? errorMessage(error));
  } finally {
    spinner.stop();
  }
}

/**
 * Helpers:
 */
function createGithubDownloader(token?: string): t.GithubPull.Downloader {
  return async (request) => {
    if (request.kind !== 'repo-blob') {
      throw new Error(`Unsupported GitHub repo download request: ${request.kind}`);
    }
    return await downloadGithubBlob({ repo: request.repo, sha: request.sha, token });
  };
}
