import { Process } from '@sys/process';

import { DenoFile, Fs, Is } from '../../-test.ts';
import { cli as tmplCli } from '../../m.tmpl/mod.ts';

export async function writeRepo() {
  const tmp = await Fs.makeTempDir({ prefix: 'tmpl.testing.repo.' });
  const root = tmp.absolute;

  await tmplCli(Fs.dirname(root), {
    _: ['repo'],
    tmpl: 'repo',
    interactive: false,
    dryRun: false,
    force: true,
    bundle: false,
    dir: Fs.basename(root),
    help: false,
    'non-interactive': true,
  });

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
  nextImports.imports['react-icons/vsc'] = 'npm:react-icons@0.0.1/vsc';

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

  const resolveExport = (name: string) => {
    const child = workspace.children.find((item) => item.denofile.name === name);
    const exports = child?.denofile.exports;
    const target = Is.str(exports) ? exports : exports?.['.'];
    if (!(child && Is.str(target))) throw new Error(`Workspace package export not found: ${name}`);
    return Fs.join(root, child.path.dir, target);
  };

  const react = packageJson.dependencies?.react;
  if (!Is.str(react)) throw new Error('Workspace package authority not found: react');

  const localizedImports: Record<string, string> = {
    ...imports.imports,
    '@sys/std': resolveExport('@sys/std'),
    '@sys/tmpl': resolveExport('@sys/tmpl'),
    react: `npm:react@${react}`,
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

export async function writePkgHelp(root: string) {
  await tmplCli(Fs.dirname(root), {
    _: ['pkg.help'],
    tmpl: 'pkg.help',
    interactive: false,
    dryRun: false,
    force: false,
    bundle: false,
    dir: Fs.basename(root),
    help: false,
    'non-interactive': true,
  });
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
