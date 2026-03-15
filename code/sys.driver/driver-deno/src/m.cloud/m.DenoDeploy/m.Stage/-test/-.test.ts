import {
  type t,
  describe,
  expect,
  expectTypeOf,
  Fs,
  slug,
  Testing,
} from '../../../../-test.ts';
import { DenoFile } from '../../../../m.runtime/mod.ts';
import { DenoDeploy } from '../../mod.ts';

describe(`DenoDeploy: staging`, () => {
  const setupWorkspace = async () => {
    const fs = await Testing.dir('DenoDeploy.stage');
    await Fs.writeJson(fs.join('deno.json'), {
      name: 'root',
      version: '0.0.0',
      workspace: ['./apps/foo', './libs/bar'],
    });

    await Fs.writeJson(fs.join('apps/foo/deno.json'), {
      name: '@test/foo',
      version: '0.0.0',
      exports: { '.': './src/mod.ts' },
    });
    await Fs.write(
      fs.join('apps/foo/src/mod.ts'),
      `export default 'foo-default';\nexport const foo = 'foo';\n`,
    );

    await Fs.writeJson(fs.join('libs/bar/deno.json'), {
      name: '@test/bar',
      version: '0.0.0',
      exports: { '.': './src/mod.ts' },
    });
    await Fs.write(fs.join('libs/bar/src/mod.ts'), `export const bar = 'bar';\n`);
    return fs;
  };

  const getError = async (fn: () => Promise<unknown>) => {
    let error: unknown;
    try {
      await fn();
    } catch (cause) {
      error = cause;
    }
    return error as Error | undefined;
  };

  it('stages a workspace target into a temp root', async () => {
    const fs = await setupWorkspace();
    const res = await DenoDeploy.stage({ target: { dir: fs.join('apps/foo') } });

    expectTypeOf(res).toEqualTypeOf<t.DenoDeploy.Stage.Result>();
    expect(res.workspace.exists).to.eql(true);
    expect(res.workspace.dir).to.eql(fs.dir);
    expect(res.target.dir).to.eql(fs.join('apps/foo'));

    expect(await Fs.exists(Fs.join(res.root, 'deno.json'))).to.eql(true);
    expect(await Fs.exists(Fs.join(res.root, 'apps/foo/src/mod.ts'))).to.eql(true);
    expect(await Fs.exists(Fs.join(res.root, 'libs/bar/src/mod.ts'))).to.eql(true);
    expect(res.entry).to.eql(Fs.join(res.root, 'deploy.entry.ts'));

    const stageText = (await Fs.readText(res.entry)).data ?? '';
    expect(stageText).to.eql(
      `import * as target from './apps/foo/src/mod.ts';\nexport default target.default;\nexport * from './apps/foo/src/mod.ts';\n`,
    );

    const stagedWorkspace = await DenoFile.workspace(Fs.join(res.root, 'deno.json'), {
      walkup: false,
    });
    expect(stagedWorkspace.exists).to.eql(true);
    expect(stagedWorkspace.children.map((child) => child.path.dir).toSorted()).to.eql([
      'apps/foo',
      'libs/bar',
    ]);

    const mod = await import(`file://${res.entry}?v=${slug()}`);
    expect(mod.default).to.eql('foo-default');
    expect(mod.foo).to.eql('foo');
  });

  it('stages into a caller-provided empty root', async () => {
    const fs = await setupWorkspace();
    const parent = await Fs.makeTempDir({ prefix: 'DenoDeploy.stage.root-' });
    const stageRoot = Fs.join(parent.absolute, 'stage');
    const res = await DenoDeploy.stage({
      target: { dir: fs.join('apps/foo') },
      root: { kind: 'path', dir: stageRoot },
    });

    expect(res.root).to.eql(stageRoot);
    expect(await Fs.exists(Fs.join(stageRoot, 'apps/foo/src/mod.ts'))).to.eql(true);
    expect((await Fs.readText(res.entry)).data).to.eql(
      `import * as target from './apps/foo/src/mod.ts';\nexport default target.default;\nexport * from './apps/foo/src/mod.ts';\n`,
    );
  });

  it('rejects a non-empty caller-provided stage root', async () => {
    const fs = await setupWorkspace();
    const parent = await Fs.makeTempDir({ prefix: 'DenoDeploy.stage.root-' });
    const stageRoot = Fs.join(parent.absolute, 'stage');
    await Fs.write(Fs.join(stageRoot, 'keep.txt'), 'x');
    const error = await getError(() =>
      DenoDeploy.stage({
        target: { dir: fs.join('apps/foo') },
        root: { kind: 'path', dir: stageRoot },
      }),
    );

    expect(error?.message).to.eql(`DenoDeploy.stage: stage root '${stageRoot}' must be empty`);
  });

  it('rejects a caller-provided stage root inside the workspace', async () => {
    const fs = await setupWorkspace();
    const stageRoot = fs.join('out/stage');
    const error = await getError(() =>
      DenoDeploy.stage({
        target: { dir: fs.join('apps/foo') },
        root: { kind: 'path', dir: stageRoot },
      }),
    );

    expect(error?.message).to.eql(
      `DenoDeploy.stage: stage root '${stageRoot}' must be outside workspace '${fs.dir}'`,
    );
  });

  it('rejects a target outside the workspace', async () => {
    const fs = await setupWorkspace();
    const external = await Testing.dir('DenoDeploy.stage.external');
    await Fs.writeJson(external.join('deno.json'), {
      name: '@test/external',
      version: '0.0.0',
      exports: { '.': './src/mod.ts' },
    });
    await Fs.write(external.join('src/mod.ts'), `export const external = true;\n`);

    const error = await getError(() => DenoDeploy.stage({ target: { dir: external.dir } }));
    expect(error?.message).to.eql(
      `DenoDeploy.stage: no workspace found for target dir '${external.dir}'`,
    );
  });

  it('rejects a target that is not a declared workspace child', async () => {
    const fs = await setupWorkspace();
    await Fs.writeJson(fs.join('apps/ghost/deno.json'), {
      name: '@test/ghost',
      version: '0.0.0',
      exports: { '.': './src/mod.ts' },
    });
    await Fs.write(fs.join('apps/ghost/src/mod.ts'), `export const ghost = true;\n`);

    const targetDir = fs.join('apps/ghost');
    const error = await getError(() => DenoDeploy.stage({ target: { dir: targetDir } }));
    expect(error?.message).to.eql(
      `DenoDeploy.stage: target dir '${targetDir}' is not a declared workspace child of '${fs.dir}'`,
    );
  });

  it('falls back to src/mod.ts when exports["."] is absent', async () => {
    const fs = await Testing.dir('DenoDeploy.stage.fallback-src-mod');
    await Fs.writeJson(fs.join('deno.json'), {
      name: 'root',
      version: '0.0.0',
      workspace: ['./apps/foo'],
    });
    await Fs.writeJson(fs.join('apps/foo/deno.json'), {
      name: '@test/foo',
      version: '0.0.0',
    });
    await Fs.write(fs.join('apps/foo/src/mod.ts'), `export const srcMod = true;\n`);

    const res = await DenoDeploy.stage({ target: { dir: fs.join('apps/foo') } });
    expect((await Fs.readText(res.entry)).data).to.eql(
      `import * as target from './apps/foo/src/mod.ts';\nexport * from './apps/foo/src/mod.ts';\n`,
    );
  });

  it('does not invent a default export for a named-only target', async () => {
    const fs = await Testing.dir('DenoDeploy.stage.named-only');
    await Fs.writeJson(fs.join('deno.json'), {
      name: 'root',
      version: '0.0.0',
      workspace: ['./apps/foo'],
    });
    await Fs.writeJson(fs.join('apps/foo/deno.json'), {
      name: '@test/foo',
      version: '0.0.0',
      exports: { '.': './src/mod.ts' },
    });
    await Fs.write(fs.join('apps/foo/src/mod.ts'), `export const namedOnly = true;\n`);

    const res = await DenoDeploy.stage({ target: { dir: fs.join('apps/foo') } });
    const stageText = (await Fs.readText(res.entry)).data ?? '';
    expect(stageText).to.eql(
      `import * as target from './apps/foo/src/mod.ts';\nexport * from './apps/foo/src/mod.ts';\n`,
    );

    const mod = await import(`file://${res.entry}?v=${slug()}`);
    expect('default' in mod).to.eql(false);
    expect(mod.namedOnly).to.eql(true);
  });
});
