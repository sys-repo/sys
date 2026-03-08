import { DenoFile, Fs, ROOT } from '../../-test.ts';

const LOCAL_DRIVER_VITE_DIR = Fs.Path.resolve('./src');
const LOCAL_DRIVER_VITE_IMPORTS = ['@sys/driver-vite', '@sys/driver-vite/main'] as const;
const IMPORT = /(?:from|import\()\s*['"]([^'"]+)['"]/g;
const VALID_PACKAGE_SPECIFIER = /^(@[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+|[A-Za-z0-9._-]+)(\/.*)?$/;

function sysPackageName(specifier: string) {
  return specifier.split('/').slice(0, 2).join('/');
}

function npmPackageName(specifier: string) {
  return specifier.startsWith('@')
    ? specifier.split('/').slice(0, 2).join('/')
    : specifier.split('/')[0];
}

async function localDriverViteImports() {
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

async function publishedDriverViteImports() {
  const paths = (await Fs.glob(LOCAL_DRIVER_VITE_DIR).find('**/*.ts')).filter(
    (path) => !path.path.includes('/.tmp/') && !path.path.includes('/node_modules/'),
  );
  const sysSpecifiers = new Set<string>();
  const npmSpecifiers = new Set<string>();
  const packageJsonPath = ROOT.resolve('package.json');
  const packageJson = (
    await Fs.readJson<{
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    }>(packageJsonPath)
  ).data;
  const npmVersions = {
    ...(packageJson?.dependencies ?? {}),
    ...(packageJson?.devDependencies ?? {}),
  };

  for (const path of paths) {
    const text = (await Fs.readText(path.path)).data ?? '';
    for (const match of text.matchAll(IMPORT)) {
      const specifier = match[1];
      if (
        specifier.startsWith('.') ||
        specifier.startsWith('npm:') ||
        specifier.startsWith('jsr:') ||
        specifier.startsWith('http:') ||
        specifier.startsWith('https:') ||
        !VALID_PACKAGE_SPECIFIER.test(specifier)
      ) {
        continue;
      }
      if (specifier.startsWith('@sys/driver-vite')) continue;
      if (specifier.startsWith('@sys/')) {
        sysSpecifiers.add(specifier);
        continue;
      }
      npmSpecifiers.add(specifier);
    }
  }

  const sysEntries = await Promise.all(
    [...sysSpecifiers].sort().map(async (specifier) => {
      const pkgName = sysPackageName(specifier);
      const version = await DenoFile.workspaceVersion(pkgName, ROOT.denofile.path, { walkup: false });
      if (typeof version !== 'string') {
        throw new Error(`Missing workspace version authority for package "${pkgName}"`);
      }
      const suffix = specifier.slice(pkgName.length);
      return [specifier, `jsr:${pkgName}@${version}${suffix}`] as const;
    }),
  );

  const npmEntries = [...npmSpecifiers].sort().map((specifier) => {
    const pkgName = npmPackageName(specifier);
    const version = npmVersions[pkgName];
    if (typeof version !== 'string') {
      throw new Error(`Missing package.json version authority for package "${pkgName}"`);
    }
    const suffix = specifier.slice(pkgName.length);
    return [specifier, `npm:${pkgName}@${version}${suffix}`] as const;
  });

  return Object.fromEntries([...sysEntries, ...npmEntries]);
}

export async function writeLocalBridgeImports(dir: string) {
  const importsPath = Fs.join(dir, 'imports.json');
  const fixtureImports = (await Fs.readJson<{ imports?: Record<string, string> }>(importsPath)).data;
  const localImports = await localDriverViteImports();
  const publishedImports = await publishedDriverViteImports();
  const original = (await Fs.readText(importsPath)).data ?? '';

  await Fs.write(
    importsPath,
    JSON.stringify(
      {
        imports: {
          ...publishedImports,
          ...localImports,
          ...(fixtureImports?.imports ?? {}),
        },
      },
      null,
      2,
    ) + '\n',
  );

  return async () => {
    await Fs.write(importsPath, original);
  };
}
