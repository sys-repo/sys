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
type WorkspaceAuthority = Awaited<ReturnType<typeof DenoFile.workspace>>;

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

function exportKey(specifier: string, pkgName: string) {
  return specifier === pkgName ? '.' : `.${specifier.slice(pkgName.length)}`;
}

function workspacePackageImport(
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
  return [specifier, Fs.Path.toFileUrl(Fs.join(dir, target)).href] as const;
}

async function localDriverViteImports(ws: WorkspaceAuthority): Promise<Record<string, string>> {
  const entries = LOCAL_DRIVER_VITE_IMPORTS.map((specifier) => {
    const entry = workspacePackageImport(ws, specifier);
    if (!entry) {
      throw new Error(`Missing workspace export authority for ${specifier}`);
    }
    return entry;
  });
  return Object.fromEntries(entries);
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

async function localBridgeImports(
  ws: WorkspaceAuthority,
  authority: BridgeAuthority,
): Promise<Record<string, string>> {
  const entries = await Promise.all(
    (await reachablePackageSpecifiers()).map(async (specifier) =>
      resolveBridgeImport(ws, specifier, authority)
    ),
  );
  return Object.fromEntries(entries);
}

export async function writeLocalBridgeImports(dir: string) {
  const importsPath = Fs.join(dir, 'imports.json');
  const fixtureImports = (await Fs.readJson<{ imports?: Record<string, string> }>(importsPath)).data?.imports ?? {};
  const ws = await DenoFile.workspace(ROOT.denofile.path, { walkup: false });
  const authority = await rootAuthority();
  const localImports = await localDriverViteImports(ws);
  const bridgeImports = await localBridgeImports(ws, authority);
  const originalImports = (await Fs.readText(importsPath)).data ?? '';

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

  return async () => {
    await Fs.write(importsPath, originalImports);
  };
}
