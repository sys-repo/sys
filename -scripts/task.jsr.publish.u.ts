import { c, Process } from './common.ts';

type PublishTriggerArgs = {
  readonly tag: string;
  readonly title: string;
  readonly mainOnly?: boolean;
};

export async function pushTriggerTag(args: PublishTriggerArgs) {
  console.info(c.bold(c.white(args.title)));
  console.info(c.gray(`refreshing reusable trigger tag: ${c.bold(args.tag)}`));
  console.info();

  if (args.mainOnly) {
    await runGit(['checkout', 'main']);
    await runGit(['pull', '--ff-only', 'origin', 'main']);
  }

  await runGit(['tag', '-d', args.tag], { allowFailure: true });
  await runGit(['push', 'origin', `:refs/tags/${args.tag}`], { allowFailure: true });
  await runGit(['tag', '-a', args.tag, '-m', `Trigger JSR publish: ${args.tag}`]);
  await runGit(['push', 'origin', args.tag]);

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

