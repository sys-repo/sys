import { Workspace } from '@sys/workspace';
import { describe, expect, Fs, it, Testing } from '@sys/testing/server';
import {
  ensureWorkspaceGraphCache,
  orderedWorkspacePaths,
  readWorkspaceGraphCache,
  writeWorkspaceGraphCache,
} from '../u.graph.ts';

describe('scripts/u.graph', () => {
  it('reads and writes the workspace graph cache artifact', async () => {
    const fs = await Testing.dir('scripts.u.graph.cache');

    await writeWorkspaceGraphCache(
      {
        orderedPaths: ['code/sys/types', 'code/sys/std'],
        edges: [{ from: 'code/sys/types', to: 'code/sys/std' }],
      },
      fs.dir,
    );

    const cache = await readWorkspaceGraphCache(fs.dir);
    expect(cache).to.eql({
      orderedPaths: ['code/sys/types', 'code/sys/std'],
      edges: [{ from: 'code/sys/types', to: 'code/sys/std' }],
    });
  });

  it('returns ordered paths from the tracked workspace graph snapshot', async () => {
    const fs = await Testing.dir('scripts.u.graph.ordered');
    await writeWorkspace(fs.dir);
    await Workspace.Prep.Graph.ensure({ cwd: fs.dir, silent: true });

    const paths = await orderedWorkspacePaths(fs.dir);
    expect(paths).to.eql(['code/pkg-a', 'code/pkg-b']);
  });

  it('ensures and writes the graph snapshot when it is missing', async () => {
    const fs = await Testing.dir('scripts.u.graph.ensure');
    await writeWorkspace(fs.dir);

    const cache = await ensureWorkspaceGraphCache(fs.dir);
    expect(cache.orderedPaths).to.eql(['code/pkg-a', 'code/pkg-b']);
    expect(await Fs.exists(Fs.join(fs.dir, 'deno.graph.json'))).to.eql(true);
  });
});

async function writeWorkspace(cwd: string) {
  await Fs.writeJson(Fs.join(cwd, 'deno.json'), {
    workspace: ['code/pkg-b', 'code/pkg-a'],
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
      'src/mod.ts': `import { a } from '../../pkg-a/src/mod.ts';\nexport const b = a;\n`,
    },
  });
}

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
