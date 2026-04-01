import { describe, expect, Fs, it, Str, Testing } from '../../-test.ts';
import { Graph } from '../m.Graph.ts';
import { State } from '../m.State.ts';

describe('Workspace.Prep.Graph', () => {
  it('builds a persisted package graph from the root workspace definition', async () => {
    const fs = await Testing.dir('WorkspacePrep.Graph.build');
    await writeWorkspace(fs.dir);

    const graph = await Graph.build(fs.dir);

    expect(graph).to.eql({
      orderedPaths: ['code/pkg-a', 'code/pkg-b'],
      edges: [{ from: 'code/pkg-a', to: 'code/pkg-b' }],
    });
  });

  it('ensures the workspace graph snapshot file and reports unchanged on repeat writes', async () => {
    const fs = await Testing.dir('WorkspacePrep.Graph.ensure');
    await writeWorkspace(fs.dir);

    const first = await Graph.ensure({ cwd: fs.dir });
    const statBefore = await Deno.stat(first.path);
    const textBefore = (await Fs.readText(first.path)).data;
    const second = await Graph.ensure({ cwd: fs.dir });
    const statAfter = await Deno.stat(first.path);
    const textAfter = (await Fs.readText(first.path)).data;
    const read = await Graph.read(fs.dir);

    expect(first.changed).to.eql(true);
    expect(first.path).to.eql(State.graphFile(fs.dir));
    expect(first.snapshot.graph).to.eql({
      orderedPaths: ['code/pkg-a', 'code/pkg-b'],
      edges: [{ from: 'code/pkg-a', to: 'code/pkg-b' }],
    });

    expect(second.changed).to.eql(false);
    expect(read).to.eql(second.snapshot);
    expect(textAfter).to.eql(textBefore);
    expect(statAfter.mtime?.getTime()).to.eql(statBefore.mtime?.getTime());
  });

  it('checks whether the tracked workspace graph snapshot is current', async () => {
    const fs = await Testing.dir('WorkspacePrep.Graph.check');
    await writeWorkspace(fs.dir);

    const missing = await Graph.check(fs.dir);
    expect(missing.path).to.eql(State.graphFile(fs.dir));
    expect(missing.current).to.eql(false);
    expect(missing.existing).to.eql(undefined);
    expect(missing.expected.graph).to.eql({
      orderedPaths: ['code/pkg-a', 'code/pkg-b'],
      edges: [{ from: 'code/pkg-a', to: 'code/pkg-b' }],
    });

    await Graph.ensure({ cwd: fs.dir });
    const current = await Graph.check(fs.dir);
    expect(current.current).to.eql(true);
    expect(current.existing?.graph).to.eql(current.expected.graph);
    expect(current.existing?.['.meta'].hash.graph).to.eql(current.expected['.meta'].hash.graph);
  });
});

async function writeWorkspace(cwd: string) {
  await Fs.writeJson(Fs.join(cwd, 'deno.json'), {
    workspace: ['code/pkg-a', 'code/pkg-b'],
  });

  await writePackage(cwd, 'code/pkg-a', {
    name: '@scope/a',
    exports: { '.': './src/mod.ts' },
    files: {
      'src/mod.ts': `export const a = 'a';\n`,
    },
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
