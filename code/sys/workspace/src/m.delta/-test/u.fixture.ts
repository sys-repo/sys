import { expect, Fs, type t } from '../../-test.ts';
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

  /** Current manifests and graph only; the caller owns the temporary directory. */
  async workspace(cwd: t.StringDir) {
    const orderedPaths = ['code/pkg-a', 'code/pkg-b', 'code/pkg-c'];
    await Fs.writeJson(Fs.join(cwd, 'deno.json'), { workspace: orderedPaths });
    for (
      const [path, name, version] of [
        ['code/pkg-a', '@scope/a', '1.0.0'],
        ['code/pkg-b', '@scope/b', '1.0.1'],
        ['code/pkg-c', '@scope/c', '0.1.0'],
      ]
    ) {
      await Fs.writeJson(Fs.join(cwd, path, 'deno.json'), { name, version });
    }
    const graphPath = Fs.join(cwd, 'deno.graph.json');
    const snapshot = WorkspaceGraph.Snapshot.create({
      graph: { orderedPaths, edges: [{ from: 'code/pkg-a', to: 'code/pkg-c' }] },
    });
    await WorkspaceGraph.Snapshot.write(snapshot, graphPath);
    return graphPath;
  },

  /** A closed four-call script, never a native-process fallback. */
  gitReads(cwd: t.StringDir, ref = 'baseline') {
    const commands = [
      ['diff', '--name-status', '-z', `${ref}..HEAD`, '--'],
      ['show', `${ref}:code/pkg-a/deno.json`],
      ['show', `${ref}:code/pkg-b/deno.json`],
      ['show', `${ref}:code/pkg-c/deno.json`],
    ].map((args) => ({ cmd: 'git', cwd, args, silent: true }));
    const outputs = [
      Fixture.output([
        'M\0code/pkg-a/src/mod.ts',
        'M\0code/pkg-b/deno.json',
        'M\0code/pkg-b/src/mod.ts',
        'A\0code/pkg-c/deno.json',
        'A\0code/pkg-c/src/mod.ts',
        'A\0deno.graph.json',
        'M\0deno.json',
        '',
      ].join('\0')),
      Fixture.output('{"version":"1.0.0"}'),
      Fixture.output('{"version":"1.0.0"}'),
      Fixture.output('', 128, `Manifest code/pkg-c/deno.json absent at ${ref}`),
    ];
    const calls: t.Process.InvokeArgs[] = [];
    const invoke: t.Process.Lib['invoke'] = (args) => {
      const index = calls.length;
      calls.push(args);
      expect(args).to.eql(commands[index]);
      return Promise.resolve(outputs[index]);
    };
    return {
      invoke,
      outputs,
      assertCalls(count = commands.length) {
        // Assert after orchestration too: the default CLI prelude catches failures.
        expect(calls).to.eql(commands.slice(0, count));
      },
    };
  },

  output(stdout: string, code = 0, stderr = ''): t.Process.Output {
    const encoder = new TextEncoder();
    return {
      code,
      success: code === 0,
      signal: null,
      stdout: encoder.encode(stdout),
      stderr: encoder.encode(stderr),
      text: { stdout, stderr },
      toString: () => stdout,
    };
  },
} as const;
