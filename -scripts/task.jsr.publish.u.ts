import { c, Process } from './common.ts';

const LINE = '━'.repeat(84);

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
    const guard = await mainCheckoutGuard();
    if (guard) {
      printLines(guard);
      Deno.exit(1);
    }
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

async function mainCheckoutGuard() {
  const branch = await currentBranch();
  const dirty = await worktreeStatus();
  if (branch === 'main' || dirty.length === 0) return;

  const files = dirty.slice(0, 5).map((line) => `  - ${line}`);
  const remaining = dirty.length - files.length;

  return [
    '',
    `${indent()}${c.bold(c.yellow('JSR PUBLISH BLOCKED'))}`,
    `${indent()}${c.bold(c.yellow(LINE))}`,
    row(
      'What',
      `publish:jsr:main needs to switch from ${branch || '(unknown branch)'} to main`,
      { color: 'white' },
    ),
    row(
      'Why',
      'Git will not checkout main because local changes would be overwritten by the branch switch',
      { color: 'white' },
    ),
    row('Files', '', { color: 'white' }),
    ...files.map((value) => row('', value, { color: 'gray' })),
    ...(remaining > 0 ? [row('', `  - ...and ${String(remaining)} more`, { color: 'gray' })] : []),
    row('', '', { color: 'white' }),
    row('Fix', 'Choose one before re-running publish:', { color: 'white' }),
    row('', '  1. Commit the changes on the current branch', { color: 'cyan' }),
    row('', '  2. Stash the changes, run publish, then pop the stash', { color: 'cyan' }),
    row('', '  3. Publish from a clean worktree already on main', { color: 'cyan' }),
    row('', '', { color: 'white' }),
    row('Retry', '  deno task publish:jsr', { color: 'cyan' }),
    row('', '', { color: 'white' }),
    row('', '  or to publish from this branch (override)', { color: 'white' }),
    row('', '  deno task publish:jsr:branch', { color: 'cyan' }),
    `${indent()}${c.bold(c.yellow(LINE))}`,
    '',
  ] as const;
}

async function currentBranch() {
  const res = await Process.invoke({
    cmd: 'git',
    args: ['branch', '--show-current'],
    silent: true,
  });
  if (!res.success) return '';
  return res.text.stdout.trim();
}

async function worktreeStatus() {
  const res = await Process.invoke({
    cmd: 'git',
    args: ['status', '--short'],
    silent: true,
  });
  if (!res.success) return [] as string[];
  return res.text.stdout.split('\n').map((line) => line.trim()).filter(Boolean);
}

function row(label: string, value: string, options: { color?: 'white' | 'cyan' | 'gray' } = {}) {
  const head = c.gray(label.padEnd(5));
  const text = options.color === 'cyan'
    ? c.cyan(value)
    : options.color === 'gray'
    ? c.gray(value)
    : c.white(value);
  return `${indent()}${head} ${c.gray('│')} ${text}`;
}

function indent() {
  return ' ';
}

function printLines(lines: readonly string[]) {
  for (const line of lines) console.info(line);
}
