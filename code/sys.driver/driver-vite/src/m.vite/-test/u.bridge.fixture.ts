import type { DenoWorkspace } from '@sys/driver-deno/t';

import { DenoFile, Fs, Is, Json, Process, ROOT } from '../../-test.ts';

const LOCAL_DRIVER_VITE_IMPORTS = ['@sys/driver-vite', '@sys/driver-vite/main'] as const;
const DENO_BINARY = Deno.build.os === 'windows' ? 'deno.exe' : 'deno';
const VALID_PACKAGE_SPECIFIER = /^(@[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+|[A-Za-z0-9._-]+)(\/.*)?$/;

type O = Record<string, string>;
type DenoInfo = {
  readonly modules?: readonly {
    readonly dependencies?: readonly { readonly specifier?: string }[];
  }[];
};

type RootPackageVersions = Readonly<O>;
type RootImportMap = Readonly<O>;
type PackageJson = {
  readonly dependencies?: O;
  readonly devDependencies?: O;
  readonly [key: string]: unknown;
};
type BridgeAuthority = {
  readonly packageVersions: RootPackageVersions;
  readonly imports: RootImportMap;
};
type WorkspaceAuthority = DenoWorkspace;
type SourceImportMatch = {
  readonly specifier: string;
};

const SOURCE_FILE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mts',
  '.cts',
  '.mjs',
  '.cjs',
]);
const SOURCE_IMPORT_PATTERN =
  /\b(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?['"](?<specifier>[^'"]+)['"]|\bimport\s*\(\s*['"](?<specifier>[^'"]+)['"]\s*\)/g;

function sysPackageName(specifier: string) {
  return specifier.split('/').slice(0, 2).join('/');
}

function npmPackageName(specifier: string) {
  return specifier.startsWith('@')
    ? specifier.split('/').slice(0, 2).join('/')
    : specifier.split('/')[0];
}

function isBarePackageSpecifier(specifier: string) {
  return npmPackageName(specifier) === specifier;
}

async function rootPackageVersions(): Promise<RootPackageVersions> {
  const rootPkg = (await Fs.readJson<{
    dependencies?: O;
    devDependencies?: O;
  }>(ROOT.resolve('package.json'))).data ?? {};
  return {
    ...(rootPkg.dependencies ?? {}),
    ...(rootPkg.devDependencies ?? {}),
  };
}

function isRelevantPackageSpecifier(specifier: string) {
  if (specifier.startsWith('.')) return false;
  if (specifier.startsWith('/')) return false;
  if (specifier.startsWith('file:')) return false;
  if (specifier.startsWith('http:')) return false;
  if (specifier.startsWith('https:')) return false;
  if (specifier.startsWith('npm:')) return false;
  if (specifier.startsWith('jsr:')) return false;
  if (!VALID_PACKAGE_SPECIFIER.test(specifier)) return false;
  if (LOCAL_DRIVER_VITE_IMPORTS.includes(specifier as (typeof LOCAL_DRIVER_VITE_IMPORTS)[number])) {
    return false;
  }
  return true;
}

function isSourceFile(path: string) {
  return SOURCE_FILE_EXTENSIONS.has(Fs.extname(path));
}

function sourcePackageSpecifiers(source: string) {
  const specifiers = new Set<string>();
  for (const match of source.matchAll(SOURCE_IMPORT_PATTERN)) {
    const statement = match[0]?.trimStart() ?? '';
    if (statement.startsWith('import type') || statement.startsWith('export type')) continue;

    const specifier = (match.groups as SourceImportMatch | undefined)?.specifier;
    if (Is.str(specifier) && isRelevantPackageSpecifier(specifier)) {
      specifiers.add(specifier);
    }
  }
  return specifiers;
}

async function rootImportMap(): Promise<RootImportMap> {
  return (await Fs.readJson<{ imports?: O }>(ROOT.resolve('imports.json')))
    .data?.imports ?? {};
}

async function rootAuthority(): Promise<BridgeAuthority> {
  return {
    imports: await rootImportMap(),
    packageVersions: await rootPackageVersions(),
  };
}

function exportKey(specifier: string, pkgName: string) {
  return specifier === pkgName ? '.' : `.${specifier.slice(pkgName.length)}`;
}

function workspacePackageImport(
  ws: WorkspaceAuthority,
  specifier: string,
): readonly [string, string] | undefined {
  const entry = workspacePackagePath(ws, specifier);
  if (!entry) return undefined;
  return [specifier, Fs.Path.toFileUrl(entry[1]).href] as const;
}

function workspacePackagePath(
  ws: WorkspaceAuthority,
  specifier: string,
): readonly [string, string] | undefined {
  const pkgName = sysPackageName(specifier);
  const child = ws.children.find((entry) => entry.pkg.name === pkgName);
  if (!child) return undefined;

  const key = exportKey(specifier, pkgName);
  const exports = child.denofile.exports ?? {};
  const target = exports[key];
  if (!Is.str(target)) return undefined;
  const dir = ROOT.resolve(child.path.dir);
  return [specifier, Fs.join(dir, target)] as const;
}

async function localDriverViteImports(ws: WorkspaceAuthority): Promise<O> {
  const entries = LOCAL_DRIVER_VITE_IMPORTS.map((specifier) => {
    const entry = workspacePackageImport(ws, specifier);
    if (!entry) {
      throw new Error(`Missing workspace export authority for ${specifier}`);
    }
    return entry;
  });
  return Object.fromEntries(entries);
}

function rewriteDriverViteConfigImports(source: string, imports: O) {
  let next = source;

  for (const specifier of LOCAL_DRIVER_VITE_IMPORTS) {
    const target = imports[specifier];
    if (!Is.str(target)) continue;
    const pattern = new RegExp(`(['"])${escapeRegExp(specifier)}\\1`, 'g');
    next = next.replace(pattern, (match, quote: string) => `${quote}${target}${quote}`);
  }

  return next;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function reachablePackageSpecifiers(entry: string): Promise<readonly string[]> {
  const output = await Process.invoke({
    cmd: DENO_BINARY,
    args: ['info', '--json', entry],
    cwd: ROOT.dir,
    silent: true,
  });
  if (!output.success) {
    throw new Error(output.text.stderr || output.text.stdout || output.toString());
  }

  const parsed = Json.safeParse<DenoInfo>(output.text.stdout);
  if (!parsed.ok || !parsed.data) {
    throw new Error('Failed to parse local driver-vite dependency graph');
  }

  const specifiers = new Set<string>();
  for (const mod of parsed.data.modules ?? []) {
    for (const dep of mod.dependencies ?? []) {
      const specifier = dep.specifier;
      if (Is.str(specifier) && isRelevantPackageSpecifier(specifier)) {
        specifiers.add(specifier);
      }
    }
  }

  return [...specifiers].sort();
}

async function resolveBridgeImport(
  ws: WorkspaceAuthority,
  specifier: string,
  authority: BridgeAuthority,
): Promise<readonly [string, string]> {
  const mapped = authority.imports[specifier];
  if (Is.str(mapped)) return [specifier, mapped] as const;

  if (!specifier.startsWith('@sys/')) {
    const pkgName = npmPackageName(specifier);
    const version = authority.packageVersions[pkgName];
    if (Is.str(version)) {
      const suffix = specifier.slice(pkgName.length);
      return [specifier, `npm:${pkgName}@${version}${suffix}`] as const;
    }
    throw new Error(`Missing root import-map authority for package "${specifier}"`);
  }

  const local = workspacePackageImport(ws, specifier);
  if (local) return local;

  const pkgName = sysPackageName(specifier);
  const version = await DenoFile.workspaceVersion(pkgName, ROOT.denofile.path, { walkup: false });
  if (!Is.str(version)) {
    throw new Error(`Missing workspace version authority for package "${pkgName}"`);
  }
  const suffix = specifier.slice(pkgName.length);
  return [specifier, `jsr:${pkgName}@${version}${suffix}`] as const;
}

async function localConfigImports(
  ws: WorkspaceAuthority,
  authority: BridgeAuthority,
  entry: string,
): Promise<O> {
  const entries = await Promise.all(
    (await reachablePackageSpecifiers(entry)).map(async (specifier) =>
      resolveBridgeImport(ws, specifier, authority)
    ),
  );
  return Object.fromEntries(entries);
}

async function localSourceImports(
  ws: WorkspaceAuthority,
  authority: BridgeAuthority,
  dir: string,
): Promise<readonly string[]> {
  const specifiers = new Set<string>();

  for await (const entry of Fs.walk(dir, { includeDirs: false })) {
    if (!isSourceFile(entry.path)) continue;
    if (entry.path.includes('/node_modules/')) continue;
    if (entry.path.includes('/dist/')) continue;
    if (entry.path.includes('/.tmp/')) continue;

    const source = (await Fs.readText(entry.path)).data ?? '';
    for (const specifier of sourcePackageSpecifiers(source)) {
      specifiers.add(specifier);
    }
  }

  return [...specifiers].sort();
}

async function importsMapForSpecifiers(
  ws: WorkspaceAuthority,
  authority: BridgeAuthority,
  specifiers: readonly string[],
) {
  const entries = await Promise.all(specifiers.map(async (specifier) => {
    const local = specifier.startsWith('@sys/driver-vite/')
      ? workspacePackagePath(ws, specifier)
      : undefined;
    if (local) return local;
    return resolveBridgeImport(ws, specifier, authority);
  }));
  return Object.fromEntries(entries);
}

async function localWorkspaceSourceImports(
  ws: WorkspaceAuthority,
  specifiers: readonly string[],
) {
  const collected = new Set<string>();

  for (const specifier of specifiers) {
    if (!specifier.startsWith('@sys/')) continue;
    const local = workspacePackagePath(ws, specifier);
    if (!local) continue;

    const [, targetPath] = local;
    if (!isSourceFile(targetPath)) continue;

    const source = (await Fs.readText(targetPath)).data ?? '';
    for (const found of sourcePackageSpecifiers(source)) {
      collected.add(found);
    }
  }

  return [...collected].sort();
}

function localPackageDependencies(
  specifiers: readonly string[],
  authority: BridgeAuthority,
): O {
  const entries = specifiers.flatMap((specifier) => {
    if (specifier.startsWith('@sys/')) return [];
    const pkgName = npmPackageName(specifier);
    const version = authority.packageVersions[pkgName];
    if (!Is.str(version)) {
      throw new Error(`Missing root package version authority for package "${pkgName}"`);
    }
    return [[pkgName, version] as const];
  });
  return Object.fromEntries(entries);
}

function localToolchainDependencies(authority: BridgeAuthority) {
  const names = ['esbuild', 'vite'] as const;
  const entries = names.map((name) => {
    const version = authority.packageVersions[name];
    if (!Is.str(version)) {
      throw new Error(`Missing root package version authority for package "${name}"`);
    }
    return [name, version] as const;
  });
  return Object.fromEntries(entries);
}

async function localToolchainImports(authority: BridgeAuthority) {
  const vite = authority.packageVersions.vite;
  if (!Is.str(vite)) {
    throw new Error('Missing root package version authority for package "vite"');
  }

  const pluginReact = authority.packageVersions['@vitejs/plugin-react'];
  if (!Is.str(pluginReact)) {
    throw new Error('Missing root package version authority for package "@vitejs/plugin-react"');
  }
  const pluginReactPkgPath = ROOT.resolve(
    'node_modules/.deno',
    `${toDenoNpmDir('@vitejs/plugin-react')}@${pluginReact}`,
    'node_modules/@vitejs/plugin-react/package.json',
  );
  const pluginReactPkg = (await Fs.readJson<{ dependencies?: O }>(pluginReactPkgPath)).data ?? {};
  const pluginutils = pluginReactPkg.dependencies?.['@rolldown/pluginutils'];
  if (!Is.str(pluginutils)) {
    throw new Error(
      'Missing @rolldown/pluginutils dependency authority from installed @vitejs/plugin-react package',
    );
  }

  return {
    '@rolldown/pluginutils': `npm:@rolldown/pluginutils@${pluginutils}`,
    fs: 'node:fs',
    path: 'node:path',
    'vite/internal': `npm:vite@${vite}/internal`,
    'vite/module-runner': `npm:vite@${vite}/module-runner`,
    zlib: 'node:zlib',
  } as const;
}

function toDenoNpmDir(name: string) {
  return name.replace('/', '+');
}

function defaultDenoJson(dir: string) {
  return Json.stringify(
    {
      workspace: [],
      importMap: 'imports.json',
    },
    2,
  );
}

function defaultPackageJson(dependencies: O) {
  return Json.stringify({ private: true, dependencies }, 2);
}

function defaultTsconfigJson() {
  const obj = {
    compilerOptions: { allowJs: true, checkJs: false, jsx: 'react-jsx', jsxImportSource: 'react' },
    include: ['src/**/*'],
  };
  return Json.stringify(obj, 2);
}

export async function writeLocalFixtureImports(dir: string, config = 'vite.config.ts') {
  const importsPath = Fs.join(dir, 'imports.json');
  const denoJsonPath = Fs.join(dir, 'deno.json');
  const packageJsonPath = Fs.join(dir, 'package.json');
  const tsconfigPath = Fs.join(dir, 'tsconfig.json');
  const configPath = Fs.join(dir, config);
  const originalImports = (await Fs.readText(importsPath)).data ?? '';
  const originalDenoJson = (await Fs.readText(denoJsonPath)).data ?? '';
  const originalPackageJson = (await Fs.readText(packageJsonPath)).data ?? '';
  const originalTsconfig = (await Fs.readText(tsconfigPath)).data ?? '';
  const originalConfig = (await Fs.readText(configPath)).data ?? '';
  const hadImports = await Fs.exists(importsPath);
  const hadDenoJson = await Fs.exists(denoJsonPath);
  const hadPackageJson = await Fs.exists(packageJsonPath);
  const hadTsconfig = await Fs.exists(tsconfigPath);
  const ws = await DenoFile.workspace(ROOT.denofile.path, { walkup: false });
  const authority = await rootAuthority();
  const localImports = await localDriverViteImports(ws);
  const configEntry = Fs.join(dir, config);

  if (!hadDenoJson) {
    await Fs.write(denoJsonPath, defaultDenoJson(dir));
  }
  if (!hadTsconfig) {
    await Fs.write(tsconfigPath, defaultTsconfigJson());
  }

  const fixtureImports =
    (await Fs.readJson<{ imports?: Record<string, string> }>(importsPath)).data?.imports ?? {};
  const bridgeImports = await localConfigImports(ws, authority, configEntry);
  const sourceSpecifiers = await localSourceImports(ws, authority, dir);
  const localWorkspaceSpecifiers = await localWorkspaceSourceImports(ws, sourceSpecifiers);
  const bridgedSpecifiers = [...new Set([...sourceSpecifiers, ...localWorkspaceSpecifiers])].sort();
  const sourceImports = await importsMapForSpecifiers(ws, authority, bridgedSpecifiers);
  const sourceDependencies = localPackageDependencies(bridgedSpecifiers, authority);
  const toolchainDependencies = localToolchainDependencies(authority);
  const toolchainImports = await localToolchainImports(authority);
  const fixturePackage = (await Fs.readJson<PackageJson>(packageJsonPath)).data ?? {};

  await Fs.write(
    importsPath,
    Json.stringify(
      {
        imports: {
          ...toolchainImports,
          ...bridgeImports,
          ...sourceImports,
          ...localImports,
          ...fixtureImports,
        },
      },
      2,
    ) + '\n',
  );

  if (!hadPackageJson || Object.keys(sourceDependencies).length > 0) {
    await Fs.write(
      packageJsonPath,
      hadPackageJson
        ? Json.stringify(
          {
            ...fixturePackage,
            dependencies: {
              ...sourceDependencies,
              ...toolchainDependencies,
              ...(fixturePackage.dependencies ?? {}),
            },
          },
          2,
        ) + '\n'
        : defaultPackageJson({ ...sourceDependencies, ...toolchainDependencies }),
    );
  }

  await Fs.write(configPath, rewriteDriverViteConfigImports(originalConfig, localImports));

  return async () => {
    if (hadImports) await Fs.write(importsPath, originalImports);
    else await Fs.remove(importsPath, { log: false });

    if (hadDenoJson) await Fs.write(denoJsonPath, originalDenoJson);
    else await Fs.remove(denoJsonPath, { log: false });

    if (hadPackageJson) await Fs.write(packageJsonPath, originalPackageJson);
    else await Fs.remove(packageJsonPath, { log: false });

    if (hadTsconfig) await Fs.write(tsconfigPath, originalTsconfig);
    else await Fs.remove(tsconfigPath, { log: false });

    await Fs.write(configPath, originalConfig);
  };
}

export async function writeLocalBridgeImports(dir: string) {
  return writeLocalFixtureImports(dir);
}
