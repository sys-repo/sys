import { DenoFile, Fs, Is, Json, Process, ROOT } from '../../-test.ts';


const LOCAL_BRIDGE_ENTRY = Fs.Path.resolve('./src/-test/vite.sample-bridge/vite.config.ts');
const LOCAL_DRIVER_VITE_IMPORTS = ['@sys/driver-vite', '@sys/driver-vite/main'] as const;
const DENO_BINARY = Deno.build.os === 'windows' ? 'deno.exe' : 'deno';
const VALID_PACKAGE_SPECIFIER = /^(@[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+|[A-Za-z0-9._-]+)(\/.*)?$/;

type DenoInfo = {
  readonly modules?: readonly {
    readonly dependencies?: readonly {
      readonly specifier?: string;
    }[];
  }[];
};

type RootPackageVersions = Readonly<Record<string, string>>;
type RootImportMap = Readonly<Record<string, string>>;
type BridgeAuthority = {
  readonly packageVersions: RootPackageVersions;
  readonly imports: RootImportMap;
};

function sysPackageName(specifier: string) {
  return specifier.split('/').slice(0, 2).join('/');
}


function npmPackageName(specifier: string) {
  return specifier.startsWith('@')
    ? specifier.split('/').slice(0, 2).join('/')
    : specifier.split('/')[0];
}

function npmDependency(specifier: string): readonly [string, string] | undefined {
  if (!specifier.startsWith('npm:')) return;

  const value = specifier.slice(4).replace(/^\//, '');
  if (value.startsWith('@')) {
    const slash = value.indexOf('/');
    if (slash === -1) return;
    const at = value.indexOf('@', slash + 1);
    if (at === -1) return;
    return [value.slice(0, at), value.slice(at + 1).split('/')[0]] as const;
  }

  const at = value.indexOf('@');
  if (at === -1) return;
  return [value.slice(0, at), value.slice(at + 1).split('/')[0]] as const;
}

async function rootPackageVersions(): Promise<RootPackageVersions> {
  const rootPkg = (await Fs.readJson<{
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
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
  if (specifier.startsWith('@sys/driver-vite')) return false;
  return true;
}

async function rootImportMap(): Promise<RootImportMap> {
  return (await Fs.readJson<{ imports?: Record<string, string> }>(ROOT.resolve('imports.json'))).data?.imports ?? {};
}

async function rootAuthority(): Promise<BridgeAuthority> {
  return {
    imports: await rootImportMap(),
    packageVersions: await rootPackageVersions(),
  };
}

async function localDriverViteImports(): Promise<Record<string, string>> {
  const ws = await DenoFile.workspace(ROOT.denofile.path, { walkup: false });
  const driverVite = ws.children.find((child) => child.pkg.name === '@sys/driver-vite');
  if (!driverVite) {
    throw new Error('Missing workspace package authority for @sys/driver-vite');
  }

  const exports = driverVite.denofile.exports ?? {};
  const dir = ROOT.resolve(driverVite.path.dir);
  return Object.fromEntries(
    LOCAL_DRIVER_VITE_IMPORTS.map((specifier) => {
      const key = specifier === '@sys/driver-vite' ? '.' : `.${specifier.slice('@sys/driver-vite'.length)}`;
      const target = exports[key];
      if (!target) {
        throw new Error(`Missing export "${key}" for ${specifier}`);
      }
      return [specifier, Fs.Path.toFileUrl(Fs.join(dir, target)).href] as const;
    }),
  );
}

async function reachablePackageSpecifiers(): Promise<readonly string[]> {
  const output = await Process.invoke({
    cmd: DENO_BINARY,
    args: ['info', '--json', LOCAL_BRIDGE_ENTRY],
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

  const pkgName = sysPackageName(specifier);
  const version = await DenoFile.workspaceVersion(pkgName, ROOT.denofile.path, { walkup: false });
  if (!Is.str(version)) {
    throw new Error(`Missing workspace version authority for package "${pkgName}"`);
  }
  const suffix = specifier.slice(pkgName.length);
  return [specifier, `jsr:${pkgName}@${version}${suffix}`] as const;
}

async function localBridgeImports(authority: BridgeAuthority): Promise<Record<string, string>> {
  const entries = await Promise.all(
    (await reachablePackageSpecifiers()).map(async (specifier) => resolveBridgeImport(specifier, authority)),
  );
  return Object.fromEntries(entries);
}

export async function writeLocalBridgeImports(dir: string) {
  const importsPath = Fs.join(dir, 'imports.json');
  const packagePath = Fs.join(dir, 'package.json');
  const fixtureImports = (await Fs.readJson<{ imports?: Record<string, string> }>(importsPath)).data?.imports ?? {};
  const authority = await rootAuthority();
  const localImports = await localDriverViteImports();
  const bridgeImports = await localBridgeImports(authority);
  const originalImports = (await Fs.readText(importsPath)).data ?? '';
  const originalPackage = (await Fs.readText(packagePath)).data ?? '';
  const dependencies = Object.fromEntries(
    Object.values(bridgeImports)
      .map((target) => npmDependency(target))
      .filter((entry): entry is readonly [string, string] => Array.isArray(entry)),
  );

  await Fs.write(
    importsPath,
    Json.stringify(
      {
        imports: {
          ...bridgeImports,
          ...localImports,
          ...fixtureImports,
        },
      },
      2,
    ) + '\n',
  );

  await Fs.write(
    packagePath,
    Json.stringify({ name: '@sys/driver-vite-bridge-local', private: true, dependencies }, 2) + '\n',
  );

  return async () => {
    await Fs.write(importsPath, originalImports);
    if (originalPackage.trim().length > 0) await Fs.write(packagePath, originalPackage);
    else await Fs.remove(packagePath, { log: false });
  };
}
