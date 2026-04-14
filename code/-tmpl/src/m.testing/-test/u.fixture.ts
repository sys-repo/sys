import { Process } from '@sys/process';

import { DenoFile, Fs, makeTmpl, Templates } from '../../-test.ts';
import { cli as tmplCli } from '../../m.tmpl/mod.ts';

export async function writeRepo() {
  const tmp = await Fs.makeTempDir({ prefix: 'tmpl.testing.repo.' });
  const root = tmp.absolute;

  const def = await Templates.repo();
  const tmpl = await makeTmpl('repo');
  await tmpl.write(root, { force: true });
  await def.default(root);

  return root;
}

export async function poisonVersions(root: string) {
  const importsPath = Fs.join(root, 'imports.json');
  const packagePath = Fs.join(root, 'package.json');

  const imports = await readJson<{ readonly imports: Record<string, string> }>(importsPath);
  const packageJson = await readJson<{
    readonly dependencies?: Record<string, string>;
    readonly devDependencies?: Record<string, string>;
  }>(packagePath);

  const nextImports = structuredClone(imports);
  nextImports.imports['@sys/std'] = 'jsr:@sys/std@999.0.0';
  nextImports.imports['@sys/tmpl'] = 'jsr:@sys/tmpl@999.0.0';
  nextImports.imports.react = 'npm:react@0.0.1';
  nextImports.imports['react-dom/'] = 'npm:react-dom@0.0.1/';

  const nextPackage = structuredClone(packageJson);
  if (nextPackage.dependencies?.react) nextPackage.dependencies.react = '0.0.1';
  if (nextPackage.devDependencies?.vite) nextPackage.devDependencies.vite = '0.0.1';

  await Fs.writeJson(importsPath, nextImports);
  await Fs.writeJson(packagePath, nextPackage);
}

export async function readAuthorityFiles(root: string) {
  return {
    imports: await readJson<{ readonly imports: Record<string, string> }>(
      Fs.join(root, 'imports.json'),
    ),
    packageJson: await readJson<{
      readonly dependencies?: Record<string, string>;
      readonly devDependencies?: Record<string, string>;
    }>(Fs.join(root, 'package.json')),
  };
}

export async function readWorkspaceAuthorities() {
  const workspace = await DenoFile.workspace();
  const root = workspace.dir;
  const imports = await readJson<{ readonly imports: Record<string, string> }>(
    Fs.join(root, 'imports.json'),
  );
  const packageJson = await readJson<{
    readonly dependencies?: Record<string, string>;
    readonly devDependencies?: Record<string, string>;
  }>(Fs.join(root, 'package.json'));

  const localizedImports: Record<string, string> = {
    ...imports.imports,
    react: `npm:react@${packageJson.dependencies?.react}`,
    'react-dom/': `npm:react-dom@${packageJson.dependencies?.['react-dom']}/`,
  };

  return {
    imports: localizedImports,
    packageVersions: {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    },
  };
}

export async function writePkg(root: string, dir = 'code/packages/foo', pkgName = '@tmp/foo') {
  await tmplCli(root, {
    _: ['pkg'],
    tmpl: 'pkg',
    interactive: false,
    dryRun: false,
    force: true,
    bundle: false,
    dir,
    pkgName,
    help: false,
    'non-interactive': true,
  });

  return Fs.join(root, dir);
}

export async function writeText(path: string, text: string) {
  await Fs.write(path, text);
}

export async function runRepoCi(root: string) {
  return await Process.invoke({
    cmd: 'deno',
    args: ['task', 'ci'],
    cwd: root,
    silent: true,
  });
}

async function readJson<T>(path: string): Promise<T> {
  const res = await Fs.readJson(path);
  if (!res.ok || !res.data) throw new Error(`Failed to read JSON: ${path}`);
  return res.data as T;
}
