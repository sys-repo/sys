import { cli as tmplCli } from '@sys/tmpl';

import { type t, Fs, Path, Process, Str } from './common.ts';
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
    throw new Error(Str.dedent(`
      Generated tmpl package build failed (code ${build.code}).

      stdout:
      ${build.text.stdout}

      stderr:
      ${build.text.stderr}
    `));
  }

  if (!(await Fs.exists(Fs.join(distDir, 'index.html')))) {
    throw new Error(`Expected generated tmpl package build to produce '${Fs.join(distDir, 'index.html')}'.`);
  }

  return { root, pkgDir, distDir };
}

export async function snapshotPackageDenoJson() {
  const path = Fs.Path.fromFileUrl(new URL('../../../../deno.json', import.meta.url));
  const text = (await Fs.readText(path)).data ?? '';
  return { path, text } as const;
}

export async function restorePackageDenoJsonIfPolluted(snapshot: { readonly path: string; readonly text: string }) {
  const current = (await Fs.readText(snapshot.path)).data ?? '';
  if (current === snapshot.text) return;
  await Fs.write(snapshot.path, snapshot.text);
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
  const stagedTargetRel = Path.relative(stage.workspace.dir, stage.target.dir);
  const entrypoint = Fs.join(stage.root, 'entry.ts');
  const compatEntrypoint = Fs.join(stage.root, 'src/m.server/main.ts');
  const stagedDistDir = Fs.join(stage.root, stagedTargetRel, 'dist');
  const imports = await readImportMap(stage.root);
  const fsImport = imports['@sys/fs'];
  const httpServerImport = resolveHttpServerImport(imports);
  if (!fsImport) throw new Error(`Expected staged imports.json to include '@sys/fs'.`);
  await ensureDeployConfig(stage.root);
  await ensureStagedDistIncluded(stage.root, stagedTargetRel);
  await Fs.ensureDir(Fs.join(stage.root, 'src', 'm.server'));
  await stageDeployDist(stage.target.dir, stagedDistDir);

  await Fs.write(
    entrypoint,
    Str.dedent(`
      import { HttpServer } from '${httpServerImport}';
      import { Fs, Pkg } from '${fsImport}';
      import { targetDir, targetDist, targetEntry, targetPkg } from './entry.paths.ts';

      const moduleDir = Fs.Path.fromFileUrl(new URL('.', import.meta.url));
      const distDir = Fs.Path.fromFileUrl(new URL(targetDist, import.meta.url));
      const pkgPath = Fs.Path.fromFileUrl(new URL(targetPkg, import.meta.url));
      const pkgModule = await import(new URL(targetPkg, import.meta.url).href);
      const pkg = pkgModule.pkg;
      const dist = (await Pkg.Dist.load(distDir)).dist;
      const hash = dist?.hash.digest ?? '';
      const app = HttpServer.create({ pkg: dist?.pkg || pkg, hash, static: false });
      app.get('/-info.json', async (c) => c.json({
        importMetaUrl: import.meta.url,
        cwd: Deno.cwd(),
        moduleDir,
        targetEntry,
        targetDir,
        targetPkg,
        targetDist,
        pkgPath,
        distDir,
        exists: {
          targetDir: await Fs.exists(Fs.join(moduleDir, targetDir)),
          pkgPath: await Fs.exists(pkgPath),
          distDir: await Fs.exists(distDir),
          indexHtml: await Fs.exists(Fs.join(distDir, 'index.html')),
          distJson: await Fs.exists(Fs.join(distDir, 'dist.json')),
        },
        sample: {
          indexHtml: (await Fs.readText(Fs.join(distDir, 'index.html'))).data?.slice(0, 200) ?? '',
          distJson: (await Fs.readText(Fs.join(distDir, 'dist.json'))).data?.slice(0, 400) ?? '',
        },
        env: {
          deploymentId: Deno.env.get('DENO_DEPLOYMENT_ID') ?? '',
          region: Deno.env.get('DENO_REGION') ?? '',
          gitSha: Deno.env.get('DENO_GIT_COMMIT_SHA') ?? '',
          gitBranch: Deno.env.get('DENO_GIT_BRANCH') ?? '',
          denoKeys: Object.keys(Deno.env.toObject()).filter((key) => key.startsWith('DENO_')).sort(),
        },
      }));
      app.use('*', HttpServer.static({
        root: distDir,
        onNotFound: async (path, c) => {
          const leaf = path.split('/').pop() ?? '';
          const isAsset = leaf.includes('.');
          if (isAsset) return c.text('Not Found', 404);
          const html = (await Fs.readText(Fs.join(distDir, 'index.html'))).data ?? '';
          return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
        },
      }));

      export default { fetch: app.fetch };
    `),
  );

  await Fs.write(
    compatEntrypoint,
    Str.dedent(`
      export { default } from '../../entry.ts';
      export * from '../../entry.ts';
    `),
  );

  return {
    stagedDir: stage.root,
    entrypoint,
    appEntrypoint: './src/m.server/main.ts',
    workspaceTarget: `./${stagedTargetRel}`,
    distDir: `./${stagedTargetRel}/dist`,
  } as const;
}

export function printDeployEntrypointInfo(args: {
  readonly stagedDir: string;
  readonly entrypoint: string;
  readonly appEntrypoint: string;
  readonly workspaceTarget: string;
  readonly distDir: string;
}) {
  for (const line of Fmt.info({
    title: 'Staged Deploy Entrypoint',
    rows: [
      { label: 'staged dir', value: args.stagedDir, color: 'white' },
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

function resolveHttpServerImport(imports: Record<string, string>): string {
  const direct = imports['@sys/http/server'];
  if (direct) return direct;

  const client = imports['@sys/http/client'];
  if (!client) {
    throw new Error(`Expected staged imports.json to include '@sys/http/client'.`);
  }

  if (!client.startsWith('jsr:@sys/http@') || !client.endsWith('/client')) {
    throw new Error(`Expected '@sys/http/client' to resolve to a JSR client spec, got '${client}'.`);
  }

  return client.replace(/\/client$/, '/server');
}

async function ensureDeployConfig(root: string) {
  const path = Fs.join(root, 'deno.json');
  const res = await Fs.readJson<Record<string, unknown>>(path);
  if (!res.ok || !res.data) throw new Error(`Failed to read staged deno.json: ${path}`);

  const current = res.data;
  const currentDeploy =
    typeof current.deploy === 'object' && current.deploy !== null ? (current.deploy as Record<string, unknown>) : {};

  await Fs.writeJson(path, {
    ...current,
    deploy: {
      ...currentDeploy,
      entrypoint: './entry.ts',
      cwd: './',
    },
  });
}

async function ensureStagedDistIncluded(root: string, targetRel: string) {
  const path = Fs.join(root, '.gitignore');
  const marker = '# generated by driver-deno external prebuilt-dist deploy proof';
  const current = (await Fs.readText(path)).data ?? '';
  if (current.includes(marker)) return;

  const lines = [marker, ...toDistUnignoreRules(targetRel)];
  const prefix = current.length > 0 && !current.endsWith('\n') ? '\n' : '';
  await Fs.write(path, `${current}${prefix}${lines.join('\n')}\n`);
}

function toDistUnignoreRules(targetRel: string): string[] {
  const clean = targetRel.replace(/^\.\//, '').replace(/\/+$/, '');
  const parts = clean.split('/').filter(Boolean);
  const rules: string[] = [];
  let acc = '';

  for (const part of parts) {
    acc = acc.length > 0 ? `${acc}/${part}` : part;
    rules.push(`!${acc}/`);
  }

  const distRel = clean.length > 0 ? `${clean}/dist` : 'dist';
  rules.push(`!${distRel}/`);
  rules.push(`!${distRel}/**`);
  return rules;
}

async function stageDeployDist(targetDir: string, stagedDistDir: string) {
  const sourceDistDir = Fs.join(targetDir, 'dist');
  const res = await Fs.copyDir(sourceDistDir, stagedDistDir, { force: true, throw: true });
  if (res.error) throw res.error;
}
