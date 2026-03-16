/**
 * @module
 * Test helpers for `@sys/tmpl`.
 */
import { type t, DenoFile, Fs, Is, Obj } from './common.ts';
import { cli } from '../m.tmpl/mod.ts';

type ImportMap = { readonly imports: Record<string, string> };
type PackageJson = {
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
};

type WorkspaceAuthorities = {
  readonly imports: Record<string, string>;
  readonly packageJson: PackageJson;
};

type ModuleDeno = { readonly name?: unknown; readonly exports?: Record<string, unknown> };

const localAuthorities = new Map<string, Promise<WorkspaceAuthorities>>();

export const TmplTesting: t.TmplTesting.Lib = {
  LocalRepoAuthorities: {
    async rewrite(args) {
      const root = args.root;
      const workspaceRoot = await resolveWorkspaceRoot(args.workspaceRoot);
      const current = await readRepoAuthorities(root);
      const next = await localizeAuthorities(current, workspaceRoot);

      await Fs.writeJson(Fs.join(root, 'imports.json'), { imports: next.imports });
      await Fs.writeJson(Fs.join(root, 'package.json'), next.packageJson);
      return next;
    },

    async read(root) {
      return await readRepoAuthorities(root);
    },
  },

  LocalRepoFixture: {
    async create(args = {}) {
      if (args.dryRun === true) {
        const err = `LocalRepoFixture.create does not support dryRun because it returns a materialized repo.`;
        throw new Error(err);
      }

      const cwd = args.cwd ?? Fs.cwd('terminal');
      const target = await resolveFixtureRoot(cwd, args.targetDir);

      await cli(target.parent, {
        _: ['repo'],
        tmpl: 'repo',
        interactive: false,
        dryRun: false,
        force: args.force === true,
        bundle: false,
        dir: target.dir,
        help: false,
        'no-interactive': true,
      });

      const authorities = await TmplTesting.LocalRepoAuthorities.rewrite({ root: target.root });
      return { root: target.root, authorities };
    },
  },
};

async function resolveWorkspaceRoot(
  workspaceRoot?: t.StringAbsoluteDir,
): Promise<t.StringAbsoluteDir> {
  if (Is.str(workspaceRoot) && workspaceRoot.length > 0) return workspaceRoot;

  const ws = await DenoFile.workspace();
  if (!ws.exists) throw new Error('Workspace not found for local repo authority rewrite.');
  return ws.dir as t.StringAbsoluteDir;
}

async function resolveFixtureRoot(cwd: t.StringDir, targetDir?: t.StringDir) {
  if (Is.str(targetDir) && targetDir.length > 0) {
    const root = Fs.resolve(cwd, targetDir) as t.StringAbsoluteDir;
    return { parent: cwd, dir: targetDir, root };
  }

  const parent = (await Fs.makeTempDir({ prefix: 'tmpl.testing.repo.' }))
    .absolute as t.StringAbsoluteDir;
  const dir = 'repo';
  const root = Fs.join(parent, dir) as t.StringAbsoluteDir;
  return { parent, dir, root };
}

async function readRepoAuthorities(
  root: t.StringAbsoluteDir,
): Promise<t.TmplTesting.LocalRepoAuthorities> {
  const imports = await readImportMap(Fs.join(root, 'imports.json'));
  const packageJson = await readPackageJson(Fs.join(root, 'package.json'));
  return { imports: imports.imports, packageJson };
}

async function localizeAuthorities(
  current: t.TmplTesting.LocalRepoAuthorities,
  workspaceRoot: t.StringAbsoluteDir,
): Promise<t.TmplTesting.LocalRepoAuthorities> {
  const local = await loadWorkspaceAuthorities(workspaceRoot);
  return {
    imports: {
      ...current.imports,
      ...local.imports,
    },
    packageJson: syncPackageJson(current.packageJson, local.packageJson),
  };
}

async function loadWorkspaceAuthorities(
  workspaceRoot: t.StringAbsoluteDir,
): Promise<WorkspaceAuthorities> {
  const key = workspaceRoot;
  const pending = localAuthorities.get(key) ?? buildWorkspaceAuthorities(workspaceRoot);
  localAuthorities.set(key, pending);
  return await pending;
}

async function buildWorkspaceAuthorities(
  workspaceRoot: t.StringAbsoluteDir,
): Promise<WorkspaceAuthorities> {
  const rootImports = await readImportMap(Fs.join(workspaceRoot, 'imports.json'));
  const rootPackage = await readPackageJson(Fs.join(workspaceRoot, 'package.json'));
  const workspace = await DenoFile.workspace(Fs.join(workspaceRoot, 'deno.json'), {
    walkup: false,
  });
  const imports: Record<string, string> = {
    ...rootImports.imports,
    ...toNpmImportSpecifiers(rootPackage),
  };

  for (const child of workspace.children) {
    const deno = child.denofile as ModuleDeno;
    if (!(Is.str(deno.name) && deno.name.startsWith('@sys/'))) continue;

    for (const [specifier, target] of Obj.entries(toExportSpecifiers(deno.name, deno.exports))) {
      imports[specifier] = Fs.join(workspaceRoot, child.path.dir, target);
    }
  }

  return { imports, packageJson: rootPackage };
}

function toNpmImportSpecifiers(pkg: PackageJson) {
  const imports: Record<string, string> = {};
  const deps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  for (const [name, version] of Obj.entries(deps)) {
    imports[name] = `npm:${name}@${version}`;
  }

  addIfPresent(imports, deps, 'react', 'react/jsx-runtime', 'jsx-runtime');
  addIfPresent(imports, deps, 'react', 'react/jsx-dev-runtime', 'jsx-dev-runtime');
  addPrefixIfPresent(imports, deps, 'react-dom');
  addPrefixIfPresent(imports, deps, 'react-icons');
  return imports;
}

function addIfPresent(
  imports: Record<string, string>,
  deps: Record<string, string>,
  pkg: string,
  specifier: string,
  subpath: string,
) {
  const version = deps[pkg];
  if (!version) return;
  imports[specifier] = `npm:${pkg}@${version}/${subpath}`;
}

function addPrefixIfPresent(
  imports: Record<string, string>,
  deps: Record<string, string>,
  pkg: string,
) {
  const version = deps[pkg];
  if (!version) return;
  imports[`${pkg}/`] = `npm:${pkg}@${version}/`;
}

function toExportSpecifiers(name: string, exports: ModuleDeno['exports']) {
  const specifiers: Record<string, string> = {};
  if (!(exports && typeof exports === 'object')) return specifiers;

  for (const [key, value] of Obj.entries(exports)) {
    if (!Is.str(value)) continue;
    const specifier = key === '.' ? name : `${name}/${key.replace(/^\.\//, '')}`;
    specifiers[specifier] = value;
  }

  return specifiers;
}

function syncPackageJson(current: PackageJson, rootPackage: PackageJson): PackageJson {
  return {
    ...current,
    dependencies: syncDependencyGroup(current.dependencies, rootPackage),
    devDependencies: syncDependencyGroup(current.devDependencies, rootPackage),
  };
}

function syncDependencyGroup(
  current: Record<string, string> | undefined,
  rootPackage: PackageJson,
): Record<string, string> | undefined {
  if (!current) return undefined;
  const rootDeps = {
    ...rootPackage.dependencies,
    ...rootPackage.devDependencies,
  };
  const next: Record<string, string> = {};

  for (const [name] of Obj.entries(current)) {
    const version = rootDeps[name];
    if (!version) throw new Error(`Missing workspace package authority for "${name}".`);
    next[name] = version;
  }

  return next;
}

async function readImportMap(path: string): Promise<ImportMap> {
  const json = await readJson<t.Json>(path);
  const imports = (json as { imports?: unknown }).imports;
  if (!(imports && typeof imports === 'object')) {
    throw new Error(`Expected import map shape at ${path}`);
  }

  return { imports: imports as Record<string, string> };
}

async function readPackageJson(path: string): Promise<PackageJson> {
  const json = await readJson<t.Json>(path);
  return json as PackageJson;
}

async function readJson<T>(path: string): Promise<T> {
  const res = await Fs.readJson(path);
  if (!res.ok || !res.data) throw new Error(`Failed to read JSON: ${path}`);
  return res.data as T;
}
