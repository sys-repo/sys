import { c, Process } from './common.ts';

const TRIGGER_TAG = 'jsr-publish';

/**
 * Refresh the reusable JSR publish trigger tag.
 *
 * IMPORTANT:
 * - This tag is a workflow trigger only.
 * - It is intentionally deleted/recreated on each publish request.
 * - Package versions remain the provenance/release identity.
 */
export async function main() {
  console.info(c.bold(c.white('JSR Publish Trigger')));
  console.info(c.gray(`refreshing reusable trigger tag: ${c.bold(TRIGGER_TAG)}`));
  console.info();

  await runGit(['checkout', 'main']);
  await runGit(['pull', '--ff-only', 'origin', 'main']);
  await runGit(['tag', '-d', TRIGGER_TAG], { allowFailure: true });
  await runGit(['push', 'origin', `:refs/tags/${TRIGGER_TAG}`], { allowFailure: true });
  await runGit(['tag', '-a', TRIGGER_TAG, '-m', `Trigger JSR publish: ${TRIGGER_TAG}`]);
  await runGit(['push', 'origin', TRIGGER_TAG]);

  console.info();
  console.info(c.green('JSR publish trigger pushed.'));
  console.info(c.gray('Tag purpose: workflow trigger only (not release provenance).'));
}

async function runGit(args: string[], options: { allowFailure?: boolean } = {}) {
  const label = c.gray(`git ${args.join(' ')}`);
  console.info(label);

  const res = await Process.inherit({ cmd: 'git', args });
  if (res.success || options.allowFailure) return res;

  throw new Error(`Git command failed: git ${args.join(' ')}`);
}

if (import.meta.main) await main();
