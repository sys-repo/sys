import { detectRepoRoot, type t } from './common.ts';
import { selectAndCopyPlan } from './u.cli.copy.git.plan.ui.ts';
import { deriveCopyPlan } from './u.cli.copy.git.plan.ts';

export async function copyGitChanged(cwd: t.StringDir) {
  const repoRootAbs = await detectRepoRoot(cwd);
  const planResult = await deriveCopyPlan(repoRootAbs);
  if (!planResult.ok) {
    const suffix = planResult.error ? ` ${String(planResult.error)}` : '';
    console.info(`Git.status probe returned ${planResult.reason}.${suffix}`);
    return;
  }

  await selectAndCopyPlan(repoRootAbs, planResult.plan);
}
