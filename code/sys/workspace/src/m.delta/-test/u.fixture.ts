import { Fs, Process, Testing, type t } from '../../-test.ts';
import { WorkspaceGraph } from '../../m.graph/mod.ts';

export const Fixture = {
  collect(args: {
    readonly orderedPaths: readonly t.StringPath[];
    readonly edges?: readonly t.WorkspaceBump.PackageEdge[];
    readonly candidates: readonly t.WorkspaceBump.Candidate[];
  }): t.WorkspaceBump.CollectResult {
    return {
      cwd: '/tmp/workspace',
      release: 'patch',
      orderedPaths: args.orderedPaths,
      edges: args.edges ?? [],
      candidates: args.candidates,
    };
  },

  candidate(pkgPath: t.StringPath, name: string): t.WorkspaceBump.Candidate {
    return {
      pkgPath,
      denoFilePath: `${pkgPath}/deno.json`,
      name,
      version: {
        current: { major: 1, minor: 0, patch: 0, prerelease: [], build: [] },
        next: { major: 1, minor: 0, patch: 1, prerelease: [], build: [] },
      },
    };
  },

  async gitBaselineWorkspace() {
    const fs = await Testing.dir('WorkspaceDelta.Git.fromRef');
    const cwd = fs.dir;
    const graphPath = Fs.join(cwd, 'deno.graph.json');

    await Fixture.writeWorkspace(cwd, ['code/pkg-a', 'code/pkg-b']);
    await Fixture.writePackage(cwd, 'code/pkg-a', '@scope/a', '1.0.0', `export const a = 'a';\n`);
    await Fixture.writePackage(cwd, 'code/pkg-b', '@scope/b', '1.0.0', `export const b = 'b';\n`);
    await Fixture.git(cwd, ['init']);
    await Fixture.git(cwd, ['config', 'user.email', 'test@example.com']);
    await Fixture.git(cwd, ['config', 'user.name', 'Test User']);
    await Fixture.git(cwd, ['add', '.']);
    await Fixture.git(cwd, ['commit', '-m', 'baseline']);
    await Fixture.git(cwd, ['tag', 'baseline']);

    await Fixture.writeWorkspace(cwd, ['code/pkg-a', 'code/pkg-b', 'code/pkg-c']);
    await Fs.write(Fs.join(cwd, 'code/pkg-a/src/mod.ts'), `export const a = 'changed';\n`);
    await Fixture.writePackage(cwd, 'code/pkg-b', '@scope/b', '1.0.1', `export const b = 'changed';\n`);
    await Fixture.writePackage(cwd, 'code/pkg-c', '@scope/c', '0.1.0', `export const c = 'new';\n`);
    const snapshot = WorkspaceGraph.Snapshot.create({
      graph: {
        orderedPaths: ['code/pkg-a', 'code/pkg-b', 'code/pkg-c'],
        edges: [{ from: 'code/pkg-a', to: 'code/pkg-c' }],
      },
    });
    await WorkspaceGraph.Snapshot.write(snapshot, graphPath);
    await Fixture.git(cwd, ['add', '.']);
    await Fixture.git(cwd, ['commit', '-m', 'current']);

    return { cwd, graphPath } as const;
  },

  async writeWorkspace(cwd: t.StringDir, workspace: readonly t.StringPath[]) {
    await Fs.writeJson(Fs.join(cwd, 'deno.json'), { workspace: [...workspace] });
  },

  async writePackage(
    cwd: t.StringDir,
    pkgPath: t.StringPath,
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
  },

  async git(cwd: t.StringDir, args: readonly string[]) {
    const res = await Process.invoke({ cmd: 'git', cwd, args: [...args], silent: true });
    if (!res.success) throw new Error(res.text.stderr || res.text.stdout);
    return res;
  },
} as const;
