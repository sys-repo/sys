import { describe, expect, Fs, it, Testing } from '../-test.ts';
import { WorkspaceCi } from './mod.ts';

describe(`@sys/workspace/ci`, () => {
  it('API', async () => {
    const m = await import('@sys/workspace/ci');
    expect(m.WorkspaceCi).to.equal(WorkspaceCi);
    expect(m.WorkspaceCi.Jsr).to.equal(WorkspaceCi.Jsr);
    expect(m.WorkspaceCi.Build).to.equal(WorkspaceCi.Build);
    expect(m.WorkspaceCi.Test).to.equal(WorkspaceCi.Test);
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
    await Fs.write(Fs.join(fs.dir, 'code/sys/workspace/src/mod.ts'), `export const pkg = 'workspace';\n`);
    await Fs.writeJson(Fs.join(fs.dir, 'deploy/sample.proxy/deno.json'), {
      name: '@sample/proxy',
      version: '0.0.1',
      exports: { '.': './src/mod.ts' },
      tasks: { build: 'deno task check' },
    });
    await Fs.write(Fs.join(fs.dir, 'deploy/sample.proxy/src/mod.ts'), `export const pkg = 'proxy';\n`);

    const logs = await captureInfo(() =>
      WorkspaceCi.sync({
        cwd: fs.dir,
        jsrScopes: ['@sys'],
        sourcePaths: ['code/sys/workspace', 'deploy/sample.proxy'],
      })
    );

    const graphText = (await Fs.readText(Fs.join(fs.dir, 'deno.graph.json'))).data ?? '';
    const jsrText = (await Fs.readText(Fs.join(fs.dir, '.github/workflows/jsr.yaml'))).data ?? '';
    const buildText = (await Fs.readText(Fs.join(fs.dir, '.github/workflows/build.yaml'))).data ?? '';
    const testText = (await Fs.readText(Fs.join(fs.dir, '.github/workflows/test.yaml'))).data ?? '';

    expect(graphText).to.include('code/sys/workspace');
    expect(jsrText).to.include('@sys/workspace');
    expect(jsrText).to.not.include('@sample/proxy');
    expect(buildText).to.include('deploy/sample.proxy');
    expect(testText).to.include('code/sys/workspace');
    expect(logs.join('\n')).to.include('chore(ci): refresh generated GitHub workflow outputs');
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
