import { cli as tmplCli } from '@sys/tmpl';

import { type t, Fs, Process } from './common.ts';
import { Fmt } from '../../u.fmt.ts';

export async function createDeployableRepoPkg(): Promise<{
  readonly root: t.StringDir;
  readonly pkgDir: t.StringDir;
  readonly distDir: t.StringDir;
}> {
  const root = await createPublishedRepoFixture();
  const pkgDir = Fs.join(root, 'code', 'projects', 'foo');
  const distDir = Fs.join(pkgDir, 'dist');

  await tmplCli(root, {
    _: ['pkg'],
    tmpl: 'pkg',
    interactive: false,
    dryRun: false,
    force: true,
    bundle: false,
    dir: 'code/projects/foo',
    pkgName: '@tmp/foo',
    help: false,
    'no-interactive': true,
  });

  const build = await Process.invoke({
    cmd: 'deno',
    args: ['task', 'build'],
    cwd: pkgDir,
    silent: true,
  });

  if (!build.success) {
    throw new Error(
      [
        `Generated tmpl package build failed (code ${build.code}).`,
        '',
        'stdout:',
        build.text.stdout,
        '',
        'stderr:',
        build.text.stderr,
      ].join('\n'),
    );
  }

  if (!(await Fs.exists(Fs.join(distDir, 'index.html')))) {
    throw new Error(`Expected generated tmpl package build to produce '${Fs.join(distDir, 'index.html')}'.`);
  }

  return { root, pkgDir, distDir };
}

async function createPublishedRepoFixture(): Promise<t.StringDir> {
  const root = (await Fs.makeTempDir({ prefix: 'tmpl.deploy.repo.' })).absolute as t.StringDir;
  await quietly(() =>
    tmplCli(root, {
      _: ['repo'],
      tmpl: 'repo',
      interactive: false,
      dryRun: false,
      force: true,
      bundle: false,
      dir: '.',
      help: false,
      'no-interactive': true,
    }),
  );
  return root;
}

export async function prepareStageForExistingApp(stage: t.DenoDeploy.Stage.Result) {
  const entrypoint = Fs.join(stage.root, 'src/m.server/main.ts');
  const imports = await ensureDeployImports(stage.root);
  const fsImport = imports['@sys/fs'];
  const httpServerImport = imports['@sys/http/server'];
  if (!fsImport) throw new Error(`Expected staged imports.json to include '@sys/fs'.`);
  if (!httpServerImport) throw new Error(`Expected staged imports.json to include '@sys/http/server'.`);

  await Fs.write(
    entrypoint,
    [
      `import { HttpServer } from '${httpServerImport}';`,
      `import { Fs, Pkg } from '${fsImport}';`,
      "import { pkg } from '../../code/projects/foo/src/pkg.ts';",
      '',
      "const distDir = Fs.Path.fromFileUrl(new URL('../../code/projects/foo/dist/', import.meta.url));",
      'const dist = (await Pkg.Dist.load(distDir)).dist;',
      "const hash = dist?.hash.digest ?? '';",
      "const app = HttpServer.create({ pkg: dist?.pkg || pkg, hash, static: ['/*', distDir] });",
      '',
      'export default { fetch: app.fetch };',
      '',
    ].join('\n'),
  );

  return {
    entrypoint,
    appEntrypoint: './src/m.server/main.ts',
    workspaceTarget: './code/projects/foo',
    distDir: './code/projects/foo/dist',
  } as const;
}

export function printDeployEntrypointInfo(args: {
  readonly entrypoint: string;
  readonly appEntrypoint: string;
  readonly workspaceTarget: string;
  readonly distDir: string;
}) {
  for (const line of Fmt.info({
    title: 'Staged Deploy Entrypoint',
    rows: [
      { label: 'staged file', value: args.entrypoint, color: 'white' },
      { label: 'app config', value: args.appEntrypoint, color: 'white' },
      { label: 'workspace', value: args.workspaceTarget, color: 'white' },
      { label: 'dist', value: args.distDir, color: 'white' },
    ],
  })) {
    console.info(line);
  }
}

async function quietly<T>(run: () => Promise<T>): Promise<T> {
  const info = console.info;
  const log = console.log;
  const warn = console.warn;
  try {
    console.info = () => undefined;
    console.log = () => undefined;
    console.warn = () => undefined;
    return await run();
  } finally {
    console.info = info;
    console.log = log;
    console.warn = warn;
  }
}

async function readImportMap(root: string): Promise<Record<string, string>> {
  const res = await Fs.readJson<{ readonly imports?: Record<string, string> }>(Fs.join(root, 'imports.json'));
  if (!res.ok || !res.data?.imports) {
    throw new Error(`Failed to read staged imports.json: ${Fs.join(root, 'imports.json')}`);
  }
  return res.data.imports;
}

async function ensureDeployImports(root: string): Promise<Record<string, string>> {
  const imports = await readImportMap(root);
  if (imports['@sys/http/server']) return imports;

  const httpClientImport = imports['@sys/http/client'];
  if (!httpClientImport) {
    throw new Error(`Expected staged imports.json to include '@sys/http/client'.`);
  }

  const next = {
    ...imports,
    '@sys/http/server': httpClientImport.replace(/\/client$/, '/server'),
  };

  await Fs.writeJson(Fs.join(root, 'imports.json'), { imports: next });
  return next;
}
