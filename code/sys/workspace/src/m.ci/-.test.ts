import { Cli, describe, expect, Fs, it, Testing } from '../-test.ts';
import { WorkspacePrep } from '../m.prep/mod.ts';
import { WorkspaceCi } from './mod.ts';
import { syncWith } from './u/u.sync.ts';

describe(`@sys/workspace/ci`, () => {
  it('API', async () => {
    const m = await import('@sys/workspace/ci');
    expect(m.WorkspaceCi).to.equal(WorkspaceCi);
    expect(m.WorkspaceCi.Jsr).to.equal(WorkspaceCi.Jsr);
    expect(m.WorkspaceCi.Build).to.equal(WorkspaceCi.Build);
    expect(m.WorkspaceCi.Test).to.equal(WorkspaceCi.Test);
    expect(m.WorkspaceCi.Test.Linux).to.equal(WorkspaceCi.Test.Linux);
    expect(m.WorkspaceCi.Test.Windows).to.equal(WorkspaceCi.Test.Windows);
    expect('sync' in m.WorkspaceCi.Test).to.eql(false);
    expect(m.WorkspaceCi.Fmt).to.equal(WorkspaceCi.Fmt);
  });

  it('formats final aggregate commit messages', () => {
    expect(
      WorkspaceCi.Fmt.finalCommitMessage({
        refreshedWorkspacePackageCount: 8,
        jsrPublishModuleCount: 30,
      }),
    ).to.eql('chore(workspace): refreshed 8 workspace packages (30 jsr:publish modules)');
    expect(
      WorkspaceCi.Fmt.finalCommitMessage({
        refreshedWorkspacePackageCount: 1,
        jsrPublishModuleCount: 1,
      }),
    ).to.eql('chore(workspace): refreshed 1 workspace package (1 jsr:publish module)');
  });

  it('formats the final aggregate commit suggestion block', () => {
    const text = Cli.stripAnsi(
      WorkspaceCi.Fmt.finalCommitSuggestion({
        refreshedWorkspacePackageCount: 2,
        jsrPublishModuleCount: 1,
      }),
    );

    expect(text).to.include('final commit msg:');
    expect(text).to.include(
      'chore(workspace): refreshed 2 workspace packages (1 jsr:publish module)',
    );
  });

  it('syncs graph and workflow outputs from explicit source paths', async () => {
    const fs = await Testing.dir('WorkspaceCi.sync');

    await Fs.writeJson(Fs.join(fs.dir, 'deno.json'), {
      workspace: ['code/sys/workspace', 'deploy/sample.proxy'],
    });
    await Fs.writeJson(Fs.join(fs.dir, 'code/sys/workspace/deno.json'), {
      name: '@sys/workspace',
      version: '0.0.1',
      exports: { '.': './src/mod.ts' },
      tasks: { test: 'deno test -A ./src/-.test.ts' },
    });
    await Fs.write(
      Fs.join(fs.dir, 'code/sys/workspace/src/mod.ts'),
      `export const pkg = 'workspace';\n`,
    );
    await Fs.writeJson(Fs.join(fs.dir, 'deploy/sample.proxy/deno.json'), {
      name: '@sample/proxy',
      version: '0.0.1',
      exports: { '.': './src/mod.ts' },
      tasks: { build: 'deno task check' },
    });
    await Fs.write(
      Fs.join(fs.dir, 'deploy/sample.proxy/src/mod.ts'),
      `export const pkg = 'proxy';\n`,
    );

    const { logs, result } = await captureInfo(() =>
      WorkspaceCi.sync({
        cwd: fs.dir,
        final: true,
        jsrScopes: ['@sys'],
        prepared: 2,
        sourcePaths: ['code/sys/workspace', 'deploy/sample.proxy'],
      })
    );

    const graphText = (await Fs.readText(Fs.join(fs.dir, 'deno.graph.json'))).data ?? '';
    const jsrText = (await Fs.readText(Fs.join(fs.dir, '.github/workflows/jsr.yaml'))).data ?? '';
    const buildText = (await Fs.readText(Fs.join(fs.dir, '.github/workflows/build.yaml'))).data ??
      '';
    const testText = (await Fs.readText(Fs.join(fs.dir, '.github/workflows/test.linux.yaml')))
      .data ?? '';

    expect(graphText).to.include('code/sys/workspace');
    expect(jsrText).to.include('@sys/workspace');
    expect(jsrText).to.not.include('@sample/proxy');
    expect(buildText).to.include('deploy/sample.proxy');
    expect(result.test.linux.kind).to.eql('written');
    expect(result.test.windows).to.eql({
      kind: 'skipped',
      target: '.github/workflows/test.windows.yaml',
      count: 0,
    });
    expect(await Fs.exists(Fs.join(fs.dir, '.github/workflows/test.windows.yaml'))).to.eql(false);

    await Fs.write(Fs.join(fs.dir, '.github/workflows/test.windows.yaml'), 'stale');
    const mixed = await WorkspaceCi.sync({
      cwd: fs.dir,
      ensureGraph: false,
      silent: true,
      jsrScopes: ['@sys'],
      sourcePaths: ['code/sys/workspace', 'deploy/sample.proxy'],
    });
    expect(mixed.test.linux.kind).to.eql('unchanged');
    expect(mixed.test.windows).to.eql({
      kind: 'removed',
      target: '.github/workflows/test.windows.yaml',
      count: 0,
    });

    const output = Cli.stripAnsi(logs.join('\n'));
    expect(testText).to.include('code/sys/workspace');
    expect(output).to.include('chore(ci): refresh generated GitHub workflow outputs');
    expect(output).to.include('final commit msg:');
    expect(output).to.include(
      'chore(workspace): refreshed 2 workspace packages (1 jsr:publish module)',
    );
  });

  it('does not forward aggregate environment input into the Windows lane', async () => {
    const fs = await Testing.dir('WorkspaceCi.sync.windows-env');
    const modulePath = 'code/sys/windows';
    await Fs.writeJson(fs.join(modulePath, 'deno.json'), {
      name: '@scope/windows',
      tasks: { 'test:windows': 'deno task test' },
    });

    const result = await WorkspaceCi.sync({
      cwd: fs.dir,
      ensureGraph: false,
      env: {
        SAFE: 'ok\n      TOKEN: ${{ secrets.RELEASE }}\n    environment: production',
      },
      silent: true,
      sourcePaths: [modulePath],
    });

    expect(result.test.windows.kind).to.eql('written');
    if (result.test.windows.kind !== 'written') throw new Error('Expected Windows workflow');
    expect(result.test.windows.yaml.includes('env:')).to.eql(false);
    expect(result.test.windows.yaml.includes('${{ secrets.RELEASE }}')).to.eql(false);
  });

  it('syncs named Linux and Windows targets independently', async () => {
    const fs = await Testing.dir('WorkspaceCi.sync.test-targets');
    const linux = 'ci/test.linux.yaml';
    const windows = 'ci/test.windows.yaml';
    await Fs.write(Fs.join(fs.dir, linux), 'stale');
    await Fs.write(Fs.join(fs.dir, windows), 'stale');

    const result = await WorkspaceCi.sync({
      cwd: fs.dir,
      ensureGraph: false,
      silent: true,
      sourcePaths: [],
      targets: { test: { linux, windows } },
    });

    expect(result.test.linux).to.eql({ kind: 'removed', target: linux, count: 0 });
    expect(result.test.windows).to.eql({ kind: 'removed', target: windows, count: 0 });
  });

  it('skips graph ensure when the caller already ran prep in this flow', async () => {
    const fs = await Testing.dir('WorkspaceCi.sync.skip-graph');
    let called = 0;
    await syncWith(
      {
        ensureGraph: () => {
          called += 1;
          throw new Error('Unexpected graph ensure');
        },
      },
      {
        cwd: fs.dir,
        ensureGraph: false,
        silent: true,
        sourcePaths: [],
      },
    );

    expect(called).to.eql(0);
  });

  it('uses the injected graph ensure dependency exactly once when enabled', async () => {
    const fs = await Testing.dir('WorkspaceCi.sync.ensure-graph');
    const calls: Parameters<typeof WorkspacePrep.Graph.ensure>[0][] = [];

    await syncWith(
      {
        ensureGraph: async (args) => {
          calls.push(args);
          return await WorkspacePrep.Graph.ensure(args);
        },
      },
      {
        cwd: fs.dir,
        silent: true,
        sourcePaths: [],
      },
    );

    expect(calls).to.eql([{ cwd: fs.dir, silent: true }]);
  });
});

async function captureInfo<T>(fn: () => Promise<T>) {
  const info = console.info;
  const logs: string[] = [];
  console.info = (...args: unknown[]) => logs.push(args.map(String).join(' '));

  try {
    return { logs, result: await fn() };
  } finally {
    console.info = info;
  }
}
