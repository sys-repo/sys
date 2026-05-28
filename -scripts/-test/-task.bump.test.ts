import { describe, expect, Fs, it, Testing } from '@sys/testing/server';
import { Cli } from '@sys/cli';
import { Process } from '@sys/process';
import { WorkspaceGraph } from '@sys/workspace';
import { main } from '../task.bump.ts';
import { bumpPolicy, postBumpPackageSyncArgs, postBumpPrepArgs } from '../task.bump.policy.ts';

describe('scripts/task.bump', () => {
  it('syncs package metadata before delegating to the dedicated bump followup prep lane', () => {
    expect(postBumpPackageSyncArgs()).to.eql([
      'run',
      '-P=dev',
      './-scripts/main.ts',
      '--prep-pkg',
    ]);
    expect(postBumpPrepArgs()).to.eql([
      'run',
      '-P=dev',
      './-scripts/main.ts',
      '--prep-bump',
      '--prep-context=bump',
    ]);
  });

  it('renders bump help with release, since, and from options', async () => {
    const calls: string[] = [];
    const info = console.info;
    console.info = (...args: unknown[]) => calls.push(String(args[0] ?? ''));

    try {
      await main({ argv: ['--help'] });
    } finally {
      console.info = info;
    }

    const output = calls.join('\n');
    expect(output).to.include('deno task bump');
    expect(output).to.include('--release <patch|minor|major>');
    expect(output).to.include('--since <git-ref>');
    expect(output).to.include('--from <pkg|path>');
    expectMaxVisibleWidth(output, 80);
  });

  it('derives dry-run bump roots from a since ref', async () => {
    const { cwd } = await gitBaselineWorkspace();
    const calls: string[] = [];
    const info = console.info;
    console.info = (...args: unknown[]) => calls.push(String(args[0] ?? ''));

    try {
      await main({ argv: ['--since', 'baseline', '--dry-run'], options: { cwd } });
    } finally {
      console.info = info;
    }

    const output = calls.join('\n');
    const deno = await Fs.readJson<{ version?: string }>(Fs.join(cwd, 'code/pkg-a/deno.json'));
    expect(output).to.include('Delta since baseline..HEAD');
    expect(output).to.include('needs bump      1 (code/pkg-a)');
    expect(output).to.include('already bumped  1 (code/pkg-b)');
    expect(output).to.include('new packages    1 (code/pkg-c)');
    expect(output).to.include('Selected root:');
    expect(deno.data?.version).to.eql('1.0.0');
  });

  it('fails clearly when since and from are both supplied', async () => {
    let error: Error | undefined;
    try {
      await main({ argv: ['--since', 'baseline', '--from', '@scope/a'] });
    } catch (err) {
      error = err as Error;
    }

    expect(error?.message).to.eql('--since cannot be used with --from.');
  });

  it('couples tmpl bumps to workspace packages embedded in the repo template authorities', () => {
    const couplings = bumpPolicy().couplings ?? [];

    expect(couplings).to.deep.include({ from: 'code/sys/workspace', to: 'code/-tmpl' });
    expect(couplings).to.deep.include({ from: 'code/sys/std', to: 'code/-tmpl' });
    expect(couplings).to.deep.include({ from: 'code/-tmpl', to: 'code/sys.tools' });
  });

  it('couples driver-vite to workspace packages embedded in published fixture authorities', () => {
    const couplings = bumpPolicy().couplings ?? [];

    expect(couplings).to.deep.include({
      from: 'code/sys/http',
      to: 'code/sys.driver/driver-vite',
    });
    expect(couplings).to.deep.include({
      from: 'code/sys/std',
      to: 'code/sys.driver/driver-vite',
    });
    expect(couplings).to.deep.include({
      from: 'code/sys.ui/ui-react',
      to: 'code/sys.driver/driver-vite',
    });
    expect(couplings).to.not.deep.include({
      from: 'code/sys.driver/driver-vite',
      to: 'code/sys.driver/driver-vite',
    });
  });
});

/**
 * Helpers:
 */
function expectMaxVisibleWidth(text: string, width: number) {
  const wide = Cli.stripAnsi(text)
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > width);
  expect(wide, wide.join('\n')).to.eql([]);
}

async function gitBaselineWorkspace() {
  const fs = await Testing.dir('task.bump.since');
  const cwd = fs.dir;
  const graphPath = Fs.join(cwd, 'deno.graph.json');

  await writeWorkspace(cwd, ['code/pkg-a', 'code/pkg-b']);
  await writePackage(cwd, 'code/pkg-a', '@scope/a', '1.0.0', `export const a = 'a';\n`);
  await writePackage(cwd, 'code/pkg-b', '@scope/b', '1.0.0', `export const b = 'b';\n`);
  await git(cwd, ['init']);
  await git(cwd, ['config', 'user.email', 'test@example.com']);
  await git(cwd, ['config', 'user.name', 'Test User']);
  await git(cwd, ['add', '.']);
  await git(cwd, ['commit', '-m', 'baseline']);
  await git(cwd, ['tag', 'baseline']);

  await writeWorkspace(cwd, ['code/pkg-a', 'code/pkg-b', 'code/pkg-c']);
  await Fs.write(Fs.join(cwd, 'code/pkg-a/src/mod.ts'), `export const a = 'changed';\n`);
  await writePackage(cwd, 'code/pkg-b', '@scope/b', '1.0.1', `export const b = 'changed';\n`);
  await writePackage(cwd, 'code/pkg-c', '@scope/c', '0.1.0', `export const c = 'new';\n`);
  const snapshot = WorkspaceGraph.Snapshot.create({
    graph: {
      orderedPaths: ['code/pkg-a', 'code/pkg-b', 'code/pkg-c'],
      edges: [{ from: 'code/pkg-a', to: 'code/pkg-c' }],
    },
  });
  await WorkspaceGraph.Snapshot.write(snapshot, graphPath);
  await git(cwd, ['add', '.']);
  await git(cwd, ['commit', '-m', 'current']);

  return { cwd } as const;
}

async function writeWorkspace(cwd: string, workspace: readonly string[]) {
  await Fs.writeJson(Fs.join(cwd, 'deno.json'), { workspace: [...workspace] });
}

async function writePackage(
  cwd: string,
  pkgPath: string,
  name: string,
  version: string,
  source: string,
) {
  await Fs.writeJson(Fs.join(cwd, pkgPath, 'deno.json'), {
    name,
    version,
    exports: { '.': './src/mod.ts' },
  });
  await Fs.write(Fs.join(cwd, pkgPath, 'src/mod.ts'), source);
}

async function git(cwd: string, args: readonly string[]) {
  const res = await Process.invoke({ cmd: 'git', cwd, args: [...args], silent: true });
  if (!res.success) throw new Error(res.text.stderr || res.text.stdout);
}
