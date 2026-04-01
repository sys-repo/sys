import { Fs, Str, Testing, Workspace } from '../../../../-test.ts';

export async function createStageWorkspace() {
  const fs = await Testing.dir('DenoDeploy.stage');
  await Fs.writeJson(fs.join('deno.json'), {
    name: 'root',
    version: '0.0.0',
    importMap: './imports.json',
    workspace: ['./code/apps/foo', './libs/bar', './libs/baz'],
  });
  await Fs.writeJson(fs.join('imports.json'), {
    imports: {
      '@test/foo': './code/apps/foo/src/mod.ts',
      '@test/bar': './libs/bar/src/mod.ts',
      '@test/baz': './libs/baz/src/mod.ts',
    },
  });
  await Fs.write(fs.join('deno.lock'), '{"version":"5"}\n');

  await Fs.writeJson(fs.join('code/apps/foo/deno.json'), {
    name: '@test/foo',
    version: '0.0.0',
    exports: { '.': './src/mod.ts' },
    tasks: { build: 'deno run -A ./-scripts/task.build.ts' },
  });
  await Fs.write(
    fs.join('code/apps/foo/src/mod.ts'),
    `import { bar } from '../../../../libs/bar/src/mod.ts';\nexport default 'foo-default';\nexport const foo = \`foo-\${bar}\`;\n`,
  );
  await Fs.write(
    fs.join('code/apps/foo/-scripts/task.build.ts'),
    Str.dedent(`
      await Deno.mkdir('dist/pkg', { recursive: true });
      await Deno.writeTextFile('dist/index.html', '<!doctype html><html><body>foo</body></html>');
      await Deno.writeTextFile('dist/pkg/app.js', "console.info('foo');\\n");
      await Deno.writeTextFile('dist/dist.json', JSON.stringify({ ok: true }, null, 2));
    `),
  );

  await Fs.writeJson(fs.join('libs/bar/deno.json'), {
    name: '@test/bar',
    version: '0.0.0',
    exports: { '.': './src/mod.ts' },
    tasks: { build: 'deno run -A ./-scripts/task.build.ts' },
  });
  await Fs.write(fs.join('libs/bar/src/mod.ts'), `export const bar = 'bar';\n`);
  await Fs.write(
    fs.join('libs/bar/-scripts/task.build.ts'),
    Str.dedent(`
      await Deno.mkdir('dist', { recursive: true });
      await Deno.writeTextFile('dist/index.html', '<!doctype html><html><body>bar</body></html>');
    `),
  );

  await Fs.writeJson(fs.join('libs/baz/deno.json'), {
    name: '@test/baz',
    version: '0.0.0',
    exports: { '.': './src/mod.ts' },
    tasks: { build: 'deno run -A ./-scripts/task.build.ts' },
  });
  await Fs.write(fs.join('libs/baz/src/mod.ts'), `export const baz = 'baz';\n`);
  await Fs.write(
    fs.join('libs/baz/-scripts/task.build.ts'),
    Str.dedent(`
      await Deno.mkdir('dist', { recursive: true });
      await Deno.writeTextFile('dist/index.html', '<!doctype html><html><body>baz</body></html>');
    `),
  );

  await writeWorkspaceGraphSnapshot(fs.dir, {
    orderedPaths: ['libs/bar', 'code/apps/foo', 'libs/baz'],
    edges: [{ from: 'libs/bar', to: 'code/apps/foo' }],
  });
  return fs;
}

export async function addStageRuntimeDriverFixture(root: string) {
  await Fs.writeJson(Fs.join(root, 'code/sys.driver/driver-deno/deno.json'), {
    name: '@sys/driver-deno',
    version: '0.0.288',
    exports: {
      '.': './src/mod.ts',
      './cloud': './src/m.cloud/mod.ts',
    },
  });
  await Fs.write(Fs.join(root, 'code/sys.driver/driver-deno/src/mod.ts'), `export const driver = true;\n`);
  await Fs.write(
    Fs.join(root, 'code/sys.driver/driver-deno/src/m.cloud/mod.ts'),
    `export const cloud = true;\n`,
  );

  await Fs.writeJson(Fs.join(root, 'code/sys/fs/deno.json'), {
    name: '@sys/fs',
    version: '0.0.0',
    exports: { '.': './src/mod.ts' },
  });
  await Fs.write(Fs.join(root, 'code/sys/fs/src/mod.ts'), `export const fs = true;\n`);

  await Fs.writeJson(Fs.join(root, 'code/sys/types/deno.json'), {
    name: '@sys/types',
    version: '0.0.0',
    exports: { '.': './src/mod.ts' },
  });
  await Fs.write(Fs.join(root, 'code/sys/types/src/mod.ts'), `export type T = true;\n`);
}

export async function writeWorkspaceGraphSnapshot(
  root: string,
  graph: import('../../../../-test.ts').t.WorkspaceGraph.PersistedGraph,
) {
  const snapshot = Workspace.Graph.Snapshot.create({ graph });
  await Workspace.Graph.Snapshot.write(snapshot, Fs.join(root, 'deno.graph.json'));
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
