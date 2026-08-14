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

    const logs = await captureInfo(() =>
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
    const testText = (await Fs.readText(Fs.join(fs.dir, '.github/workflows/test.yaml'))).data ?? '';

    expect(graphText).to.include('code/sys/workspace');
    expect(jsrText).to.include('@sys/workspace');
    expect(jsrText).to.not.include('@sample/proxy');
    expect(buildText).to.include('deploy/sample.proxy');
    const output = Cli.stripAnsi(logs.join('\n'));
    expect(testText).to.include('code/sys/workspace');
    expect(output).to.include('chore(ci): refresh generated GitHub workflow outputs');
    expect(output).to.include('final commit msg:');
    expect(output).to.include(
      'chore(workspace): refreshed 2 workspace packages (1 jsr:publish module)',
    );
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

async function captureInfo(fn: () => Promise<unknown>) {
  const info = console.info;
  const logs: string[] = [];
  console.info = (...args: unknown[]) => logs.push(args.map(String).join(' '));

  try {
    await fn();
  } finally {
    console.info = info;
  }

  return logs;
}
