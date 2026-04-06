import { Workspace } from '@sys/workspace';
import { describe, expect, Fs, it, Testing } from '@sys/testing/server';
import { Str } from '../common.ts';
import { main } from '../task.check.graph.ts';

describe('scripts/task.check.graph', () => {
  it('passes when the tracked workspace graph is current', async () => {
    const fs = await Testing.dir('scripts.task.check.graph.current');
    await writeWorkspace(fs.dir);
    await Workspace.Prep.Graph.ensure({ cwd: fs.dir, silent: true });

    await captureInfo(() => main(fs.dir));
  });

  it('fails when the tracked workspace graph is missing', async () => {
    const fs = await Testing.dir('scripts.task.check.graph.missing');
    await writeWorkspace(fs.dir);

    const err = await getError(() => captureInfo(() => main(fs.dir)));
    expect(err?.message).to.include(`Workspace graph missing at '${fs.join('deno.graph.json')}'`);
  });

  it('fails when the tracked workspace graph is stale', async () => {
    const fs = await Testing.dir('scripts.task.check.graph.stale');
    await writeWorkspace(fs.dir);
    await Workspace.Prep.Graph.ensure({ cwd: fs.dir, silent: true });
    const path = fs.join('deno.graph.json');
    const current = JSON.parse((await Fs.readText(path)).data ?? '');
    current.graph = { orderedPaths: ['code/pkg-b', 'code/pkg-a'], edges: [] };
    current['.meta'].hash['/graph'] = 'stale';
    await Fs.write(path, JSON.stringify(current, null, 2) + '\n');

    const err = await getError(() => captureInfo(() => main(fs.dir)));
    expect(err?.message).to.include(`Workspace graph is stale at '${path}'`);
  });
});

async function writeWorkspace(cwd: string) {
  await Fs.writeJson(Fs.join(cwd, 'deno.json'), {
    workspace: ['code/pkg-b', 'code/pkg-a', 'code/pkg-b'],
  });

  await writePackage(cwd, 'code/pkg-a', {
    name: '@scope/a',
    exports: { '.': './src/mod.ts' },
    files: { 'src/mod.ts': `export const a = 'a';\n` },
  });

  await writePackage(cwd, 'code/pkg-b', {
    name: '@scope/b',
    exports: { '.': './src/mod.ts' },
    files: {
      'src/mod.ts': Str.dedent(`
        import { a } from '../../pkg-a/src/mod.ts';
        export const b = a;
      `),
    },
  });
}

/**
 * Helpers:
 */
async function writePackage(
  cwd: string,
  path: string,
  args: {
    name: string;
    exports: Record<string, string>;
    files: Record<string, string>;
  },
) {
  await Fs.writeJson(Fs.join(cwd, path, 'deno.json'), {
    name: args.name,
    version: '1.0.0',
    exports: args.exports,
  });

  for (const [rel, source] of Object.entries(args.files)) {
    await Fs.write(Fs.join(cwd, path, rel), source);
  }
}

async function getError(fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (error) {
    return error as Error;
  }
}

async function captureInfo(fn: () => Promise<unknown>) {
  const info = console.info;
  console.info = () => {};

  try {
    await fn();
  } finally {
    console.info = info;
  }
}
