import { describe, expect, Fs, it, Str, Testing } from '../../-test.ts';
import { WorkspacePrep } from '../mod.ts';

describe('Workspace.Prep.run', () => {
  it('normalizes the workspace and ensures the graph snapshot in one canonical pass', async () => {
    const fs = await Testing.dir('WorkspacePrep.run');
    const graphPath = Fs.join(fs.dir, 'deno.graph.json');

    await Fs.writeJson(Fs.join(fs.dir, 'deno.json'), {
      workspace: ['code/pkg-b', 'code/pkg-a', 'code/pkg-b'],
    });

    await writePackage(fs.dir, 'code/pkg-a', {
      name: '@scope/a',
      exports: { '.': './src/mod.ts' },
      files: { 'src/mod.ts': `export const a = 'a';\n` },
    });

    await writePackage(fs.dir, 'code/pkg-b', {
      name: '@scope/b',
      exports: { '.': './src/mod.ts' },
      files: {
        'src/mod.ts': Str.dedent(`
          import { a } from '../../pkg-a/src/mod.ts';
          export const b = a;
        `),
      },
    });

    const result = await WorkspacePrep.run({ cwd: fs.dir });
    const deno = await Fs.readJson<Record<string, unknown>>(Fs.join(fs.dir, 'deno.json'));

    expect(result.workspace).to.eql({
      changed: true,
      path: Fs.join(fs.dir, 'deno.json'),
    });
    expect(result.graph.changed).to.eql(true);
    expect(result.graph.path).to.eql(graphPath);
    expect(result.graph.snapshot.graph).to.eql({
      orderedPaths: ['code/pkg-a', 'code/pkg-b'],
      edges: [{ from: 'code/pkg-a', to: 'code/pkg-b' }],
    });
    expect(deno.data?.workspace).to.eql(['code/pkg-a', 'code/pkg-b']);
  });

  it('suppresses prep phase output when silent is true', async () => {
    const fs = await Testing.dir('WorkspacePrep.run.silent');

    await Fs.writeJson(Fs.join(fs.dir, 'deno.json'), {
      workspace: ['code/pkg-b', 'code/pkg-a'],
    });

    await writePackage(fs.dir, 'code/pkg-a', {
      name: '@scope/a',
      exports: { '.': './src/mod.ts' },
      files: {
        'src/mod.ts': `export const a = 'a';\n`,
      },
    });

    await writePackage(fs.dir, 'code/pkg-b', {
      name: '@scope/b',
      exports: { '.': './src/mod.ts' },
      files: {
        'src/mod.ts': Str.dedent(`
          import { a } from '../../pkg-a/src/mod.ts';
          export const b = a;
        `),
      },
    });

    const info = console.info;
    const logs: string[] = [];
    console.info = (...args: unknown[]) => logs.push(args.map(String).join(' '));

    try {
      await WorkspacePrep.run({ cwd: fs.dir, silent: true });
    } finally {
      console.info = info;
    }

    expect(logs).to.eql([]);
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
