import { describe, expect, Fs, it, Testing } from '../../-test.ts';
import { WorkspaceGraph } from '../mod.ts';

describe('Workspace.Graph.collect', () => {
  it('collects a normalized local graph from local deno package entries', async () => {
    const fs = await Testing.dir('WorkspaceGraph.collect');

    await writePackage(fs.dir, 'code/pkg-a', {
      name: '@scope/a',
      exports: { '.': './src/mod.ts', './types': './src/types.ts' },
      files: {
        'src/mod.ts': `export const a = 'a';\n`,
        'src/types.ts': `export type A = string;\n`,
      },
    });

    await writePackage(fs.dir, 'code/pkg-b', {
      name: '@scope/b',
      exports: { '.': './src/mod.ts' },
      files: {
        'src/mod.ts':
          `import { a } from '../../pkg-a/src/mod.ts';\n` +
          `import type { A } from '../../pkg-a/src/types.ts';\n` +
          `export const b: A = a;\n`,
      },
    });

    const graph = await WorkspaceGraph.collect({
      cwd: fs.dir,
      source: { include: ['./code/**/deno.json'] },
    });

    expect(graph.packages).to.eql([
      {
        path: 'code/pkg-a',
        manifestPath: 'code/pkg-a/deno.json',
        name: '@scope/a',
        entryPaths: ['code/pkg-a/src/mod.ts', 'code/pkg-a/src/types.ts'],
      },
      {
        path: 'code/pkg-b',
        manifestPath: 'code/pkg-b/deno.json',
        name: '@scope/b',
        entryPaths: ['code/pkg-b/src/mod.ts'],
      },
    ]);

    expect(graph.roots).to.eql([
      'code/pkg-a/src/mod.ts',
      'code/pkg-a/src/types.ts',
      'code/pkg-b/src/mod.ts',
    ]);

    expect(graph.modules).to.eql([
      { key: 'code/pkg-a/src/mod.ts', packagePath: 'code/pkg-a' },
      { key: 'code/pkg-a/src/types.ts', packagePath: 'code/pkg-a' },
      { key: 'code/pkg-b/src/mod.ts', packagePath: 'code/pkg-b' },
    ]);

    expect(graph.edges).to.eql([
      { from: 'code/pkg-b/src/mod.ts', to: 'code/pkg-a/src/mod.ts', kind: 'code' },
      { from: 'code/pkg-b/src/mod.ts', to: 'code/pkg-a/src/types.ts', kind: 'type' },
    ]);
  });
});

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
