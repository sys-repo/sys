import { Fs, Testing } from '../../../../-test.ts';

export async function createStageWorkspace() {
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
}

export async function getStageError(fn: () => Promise<unknown>) {
  let error: unknown;
  try {
    await fn();
  } catch (cause) {
    error = cause;
  }
  return error as Error | undefined;
}
