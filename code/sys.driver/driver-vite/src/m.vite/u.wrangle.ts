import { createRequire } from 'node:module';
import { type t, Fs, Path, ViteConfig } from './common.ts';
import { Bootstrap } from './u.bootstrap.ts';

/**
 * Helpers
 */
export const Wrangle = {
  async command(paths: t.ViteConfigPaths, arg: string) {
    const config = 'vite.config.ts';
    const env = await wrangle.env(paths.cwd);
    const bootstrap = await Bootstrap.create(paths.cwd, await wrangle.viteSpecifier(paths.cwd));
    const args = await wrangle.args(paths, arg, config, env, bootstrap?.path);
    const cmd = ['deno', ...args].join(' ');
    return {
      cmd,
      args,
      env,
      dispose: async () => {
        await bootstrap?.cleanup();
      },
    } as const;
  },

  async pathsFromConfigfile(cwd?: t.StringDir) {
    const rootDir = cwd || Path.cwd();
    const filename = 'vite.config.ts';
    const path = Path.join(rootDir, filename);

    const res = await ViteConfig.fromFile(path);
    let paths = res.paths;

    if (!paths) {
      const err = `Failed to load paths from [${filename}], ensure it exports "paths". Source: ${path}`;
      console.error(res.error);
      throw new Error(err);
    }

    const delta = Path.relative(paths.cwd, rootDir);
    if (delta) {
      /**
       * When config discovery is performed from a copied fixture or nested temp root,
       * the resolved config paths can be rooted at a different CWD than the caller.
       * Adjust the application entry/output subpaths to preserve the caller-relative
       * build layout.
       */
      const entry = Path.normalize(Path.join(delta, paths.app.entry));
      const outDir = Path.normalize(Path.join(delta, paths.app.outDir));
      const app = { ...paths.app, entry, outDir };
      paths = { ...paths, app };
    }

    return paths;
  },

  async packageAnchor(start: string) {
    return await wrangle.packageAnchor(start);
  },

  async viteSpecifier(start: string, moduleUrl = import.meta.url) {
    return await wrangle.viteSpecifier(start, moduleUrl);
  },
} as const;

const wrangle = {
  async args(
    paths: t.ViteConfigPaths,
    arg: string,
    config: string,
    env: Record<string, string>,
    importMap?: string,
  ) {
    const [cmd, ...rest] = arg.trim().split(/\s+/).filter(Boolean);
    const permissions = await wrangle.permissions(paths, cmd ?? '', env);
    const vite = await wrangle.viteSpecifier(paths.cwd);
    const configLoader = await wrangle.configLoaderArg(paths.cwd);
    return [
      'run',
      ...permissions,
      '--node-modules-dir',
      importMap ? `--import-map=${importMap}` : '',
      vite,
      cmd,
      ...rest,
      configLoader,
      `--config=${config}`,
    ].filter(Boolean);
  },

  async permissions(paths: t.ViteConfigPaths, cmd: string, env: Record<string, string>) {
    const allowRun = `--allow-run=${env.ESBUILD_BINARY_PATH},${Deno.execPath()}`;
    const allowWrite = `--allow-write=${(await wrangle.writeRoots(paths)).join(',')}`;
    const allowSysCommon = '--allow-sys=osRelease,homedir,uid,gid';
    const allowNetLocal = '--allow-net=localhost,127.0.0.1,0.0.0.0,[::1],[::]';
    const common = ['--allow-env', '--allow-ffi', '--allow-read', allowSysCommon, allowRun, allowWrite];
    const allowSysDev = '--allow-sys=osRelease,homedir,uid,gid,networkInterfaces';

    // Vite 8 / rolldown build can issue a localhost DNS lookup under Deno during config/runtime startup.
    if (cmd === 'build') return [...common, allowNetLocal];
    if (cmd === 'dev') return ['--allow-env', '--allow-ffi', '--allow-read', allowSysDev, allowRun, allowWrite, allowNetLocal];
    return common;
  },

  async env(cwd: string) {
    return {
      ESBUILD_BINARY_PATH: await wrangle.esbuildBinaryPath(cwd),
    } as const;
  },

  async viteSpecifier(start: string, moduleUrl = import.meta.url) {
    const anchors = await wrangle.vitePackageAnchors(start, moduleUrl);

    let lastMissing = '';
    for (const anchor of anchors) {
      const version = await wrangle.viteVersionFromPackage(anchor);
      if (version) return `npm:vite@${version}`;
      lastMissing = anchor;
    }

    if (!lastMissing) {
      throw new Error(`Missing "vite" dependency in package authority: ${start}`);
    }

    throw new Error(`Missing "vite" dependency in package authority: ${lastMissing}`);
  },

  async viteVersionFromPackage(anchor: string) {
    const pkg = (await Fs.readJson<{ dependencies?: Record<string, string>; devDependencies?: Record<string, string> }>(
      anchor,
    )).data ?? {};
    return pkg.dependencies?.vite ?? pkg.devDependencies?.vite ?? '';
  },

  async configLoaderArg(cwd: string) {
    const version = await wrangle.viteVersionFromPackage(await wrangle.packageAnchor(cwd));
    return wrangle.viteMajor(version) >= 8 ? '--configLoader=native' : '';
  },

  async vitePackageAnchors(start: string, moduleUrl = import.meta.url) {
    const anchors = [await wrangle.packageAnchor(start)];
    const moduleStart = wrangle.moduleStart(moduleUrl);
    if (moduleStart) {
      const moduleAnchor = await wrangle.packageAnchor(moduleStart);
      if (!anchors.includes(moduleAnchor)) anchors.push(moduleAnchor);
    }
    return anchors;
  },

  moduleStart(moduleUrl = import.meta.url) {
    if (!moduleUrl.startsWith('file:')) return '';
    return Path.dirname(Path.fromFileUrl(moduleUrl));
  },

  async viteCacheDir(cwd: string) {
    const require = await wrangle.esbuildRequire(cwd);
    const esbuildMain = require.resolve('esbuild');
    const [nodeModulesDir] = esbuildMain.split(/[\\/]\.deno[\\/]/);
    return Path.join(nodeModulesDir, '.vite');
  },

  async writeRoots(paths: t.ViteConfigPaths) {
    const roots = [paths.cwd, await wrangle.viteCacheDir(paths.cwd)];
    const canonical = await Promise.all(roots.map((path) => wrangle.tryRealPath(path)));
    return [...new Set([...roots, ...canonical.filter(Boolean)])];
  },

  async tryRealPath(path: string) {
    try {
      return await Fs.realPath(path);
    } catch {
      return '';
    }
  },

  async esbuildBinaryPath(cwd: string) {
    const require = await wrangle.esbuildRequire(cwd);
    const { pkg, subpath } = wrangle.esbuildPackage();
    try {
      return require.resolve(`${pkg}/${subpath}`);
    } catch {
      // Deno's npm layout may not expose the platform package as a direct resolution target.
    }

    const esbuildMain = require.resolve('esbuild');
    const esbuildPkgDir = Path.dirname(Path.dirname(esbuildMain));
    const siblingBinary = Path.join(Path.dirname(esbuildPkgDir), pkg, subpath);
    if (await Fs.exists(siblingBinary)) return siblingBinary;

    const binScript = require.resolve('esbuild/bin/esbuild');
    if (await Fs.exists(binScript)) return binScript;

    throw new Error(`Failed to resolve esbuild binary from runtime package boundary: ${cwd}`);
  },

  async requireFrom(start: string) {
    return createRequire(await wrangle.packageAnchor(start));
  },

  moduleRequire() {
    if (!import.meta.url.startsWith('file:')) return null;
    return createRequire(import.meta.url);
  },

  async esbuildRequire(cwd: string) {
    const consumer = await wrangle.requireFrom(cwd);
    try {
      consumer.resolve('esbuild');
      return consumer;
    } catch {
      const local = wrangle.moduleRequire();
      if (local) return local;
      throw new Error(`Failed to resolve "esbuild" from consumer package boundary: ${cwd}`);
    }
  },

  async packageAnchor(start: string) {
    let current = Path.resolve(start);

    while (true) {
      const path = Path.join(current, 'package.json');
      const stat = await Fs.stat(path);
      if (stat?.isFile) return path;

      const parent = Path.dirname(current);
      if (parent === current) return Path.join(Path.resolve(start), 'package.json');
      current = parent;
    }
  },

  esbuildPackage() {
    const arch = wrangle.normalizeEsbuildArch(Deno.build.arch);
    const key = `${Deno.build.os}/${arch}`;
    const pkg = ESBUILD_PACKAGES[key as keyof typeof ESBUILD_PACKAGES];
    if (!pkg) throw new Error(`Unsupported esbuild platform: ${key}`);
    const subpath = Deno.build.os === 'windows' ? 'esbuild.exe' : 'bin/esbuild';
    return { pkg, subpath } as const;
  },

  viteMajor(version: string) {
    const match = version.trim().match(/^[@~^<>=\s]*(\d+)/);
    return match ? Number(match[1]) : 0;
  },

  normalizeEsbuildArch(arch: string) {
    if (arch === 'aarch64') return 'arm64';
    if (arch === 'x86_64') return 'x64';
    return arch;
  },
} as const;

// Derived from the installed esbuild resolver tables in:
//   node_modules/.deno/esbuild@*/node_modules/esbuild/lib/main.js
// Keep this map aligned with esbuild's platform package resolution logic.
const ESBUILD_PACKAGES = {
  'aix/ppc64': '@esbuild/aix-ppc64',
  'android/arm': '@esbuild/android-arm',
  'android/arm64': '@esbuild/android-arm64',
  'android/x64': '@esbuild/android-x64',
  'darwin/arm64': '@esbuild/darwin-arm64',
  'darwin/x64': '@esbuild/darwin-x64',
  'freebsd/arm64': '@esbuild/freebsd-arm64',
  'freebsd/x64': '@esbuild/freebsd-x64',
  'linux/arm': '@esbuild/linux-arm',
  'linux/arm64': '@esbuild/linux-arm64',
  'linux/ia32': '@esbuild/linux-ia32',
  'linux/loong64': '@esbuild/linux-loong64',
  'linux/mips64el': '@esbuild/linux-mips64el',
  'linux/ppc64': '@esbuild/linux-ppc64',
  'linux/riscv64': '@esbuild/linux-riscv64',
  'linux/s390x': '@esbuild/linux-s390x',
  'linux/x64': '@esbuild/linux-x64',
  'netbsd/arm64': '@esbuild/netbsd-arm64',
  'netbsd/x64': '@esbuild/netbsd-x64',
  'openbsd/arm64': '@esbuild/openbsd-arm64',
  'openbsd/x64': '@esbuild/openbsd-x64',
  'openharmony/arm64': '@esbuild/openharmony-arm64',
  'sunos/x64': '@esbuild/sunos-x64',
  'windows/arm64': '@esbuild/win32-arm64',
  'windows/ia32': '@esbuild/win32-ia32',
  'windows/x64': '@esbuild/win32-x64',
} as const satisfies Record<string, string>;
