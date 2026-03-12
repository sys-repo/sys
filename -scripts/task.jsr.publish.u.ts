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

  const current = await currentBranch();

  if (args.mainOnly) {
    const guard = mainBranchGuard(current);
    if (guard) {
      printLines(guard);
      Deno.exit(1);
    }
    await runGit(['fetch', 'origin', 'main:refs/remotes/origin/main']);
  }

  await runGit(['tag', '-d', args.tag], { allowFailure: true });
  await runGit(['push', 'origin', `:refs/tags/${args.tag}`], { allowFailure: true });
  const target = args.mainOnly ? 'refs/remotes/origin/main' : 'HEAD';
  await runGit(['tag', '-a', args.tag, target, '-m', `Trigger JSR publish: ${args.tag}`]);
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

function mainBranchGuard(branch: string) {
  if (branch === 'main') return;

  return [
    '',
    `${indent()}${c.bold(c.yellow('JSR PUBLISH BLOCKED'))}`,
    `${indent()}${c.bold(c.yellow(LINE))}`,
    richRow('What', [
      c.cyan('publish:jsr'),
      c.white(' targets '),
      c.magenta('main'),
      c.white('-only publish while you are on '),
      c.cyan(branch || '(unknown branch)'),
      c.white(' branch'),
    ]),
    row(
      'Why',
      'Strict publish is reserved for the mainline release path.',
      { color: 'white' },
    ),
    row('', '', { color: 'white' }),
    row('Fix', 'Choose one before re-running publish:', { color: 'white' }),
    richRow('', [
      c.white('  1. Use '),
      c.cyan('deno task publish:jsr:branch'),
      c.white(' for the current branch'),
    ]),
    richRow('', [
      c.white('  2. Switch to '),
      c.magenta('main'),
      c.white(' if you intend the strict '),
      c.magenta('main'),
      c.white(' publish path'),
    ]),
    row('', '', { color: 'white' }),
    row('Retry', '  deno task publish:jsr', { color: 'cyan' }),
    row('', '  or', { color: 'gray' }),
    richRow('', [
      c.cyan('  deno task publish:jsr:branch'),
      c.gray(' (branch override)'),
    ]),
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

function row(label: string, value: string, options: { color?: 'white' | 'cyan' | 'gray' } = {}) {
  const head = c.gray(label.padEnd(5));
  const text = options.color === 'cyan'
    ? c.cyan(value)
    : options.color === 'gray'
    ? c.gray(value)
    : c.white(value);
  return `${indent()}${head} ${c.gray('│')} ${text}`;
}

function richRow(label: string, parts: readonly string[]) {
  const head = c.gray(label.padEnd(5));
  return `${indent()}${head} ${c.gray('│')} ${parts.join('')}`;
}

function indent() {
  return ' ';
}

function printLines(lines: readonly string[]) {
  for (const line of lines) console.info(line);
}
