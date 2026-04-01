import { Workspace } from '@sys/workspace';
import { Fs, Str } from '../../../-test.ts';

export async function createDenoWorkspace(root: string) {
  await Fs.writeJson(`${root}/deno.json`, {
    name: 'root',
    version: '0.0.0',
    workspace: ['./code/apps/foo', './libs/bar'],
  });

  await Fs.writeJson(`${root}/code/apps/foo/deno.json`, {
    name: '@test/foo',
    version: '0.0.0',
    exports: { '.': './src/mod.ts' },
    tasks: { build: 'deno run -A ./-scripts/task.build.ts' },
  });
  await Fs.write(`${root}/code/apps/foo/src/mod.ts`, `export default 'foo-default';\n`);
  await Fs.write(
    `${root}/code/apps/foo/-scripts/task.build.ts`,
    Str.dedent(`
      await Deno.mkdir('dist', { recursive: true });
      await Deno.writeTextFile('dist/index.html', '<!doctype html><html><body>foo</body></html>');
      await Deno.writeTextFile('dist/dist.json', JSON.stringify({ ok: true }, null, 2));
    `),
  );

  await Fs.writeJson(`${root}/libs/bar/deno.json`, {
    name: '@test/bar',
    version: '0.0.0',
    exports: { '.': './src/mod.ts' },
    tasks: { build: 'deno run -A ./-scripts/task.build.ts' },
  });
  await Fs.write(`${root}/libs/bar/src/mod.ts`, `export const bar = 'bar';\n`);
  await Fs.write(
    `${root}/libs/bar/-scripts/task.build.ts`,
    Str.dedent(`
      await Deno.mkdir('dist', { recursive: true });
      await Deno.writeTextFile('dist/index.html', '<!doctype html><html><body>bar</body></html>');
    `),
  );

  await Workspace.Prep.Graph.ensure({ cwd: root });
  return root;
}
