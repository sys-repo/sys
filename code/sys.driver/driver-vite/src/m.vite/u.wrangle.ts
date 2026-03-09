import { createRequire } from 'node:module';
import { type t, Fs, Path, ViteConfig } from './common.ts';

/**
 * Helpers
 */
export const Wrangle = {
  async command(paths: t.ViteConfigPaths, arg: string) {
    const config = 'vite.config.ts';
    const env = wrangle.env(paths.cwd);
    const args = await wrangle.args(paths, arg, config, env);
    const cmd = ['deno', ...args].join(' ');
    return { cmd, args, env } as const;
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

  packageAnchor(start: string) {
    return wrangle.packageAnchor(start);
  },
} as const;

const wrangle = {
  async args(paths: t.ViteConfigPaths, arg: string, config: string, env: Record<string, string>) {
    const [cmd, ...rest] = arg.trim().split(/\s+/).filter(Boolean);
    const permissions = await wrangle.permissions(paths, cmd ?? '', env);
    return [
      'run',
      ...permissions,
      '--node-modules-dir',
      'npm:vite',
      cmd,
      ...rest,
      `--config=${config}`,
    ].filter(Boolean);
  },

  async permissions(paths: t.ViteConfigPaths, cmd: string, env: Record<string, string>) {
    const allowRun = `--allow-run=${env.ESBUILD_BINARY_PATH},${Deno.execPath()}`;
    const allowWrite = `--allow-write=${(await wrangle.writeRoots(paths)).join(',')}`;
    const allowSysCommon = '--allow-sys=osRelease,homedir,uid,gid';
    const common = ['--allow-env', '--allow-ffi', '--allow-read', allowSysCommon, allowRun, allowWrite];
    const allowNetDev = '--allow-net=localhost,127.0.0.1,0.0.0.0';
    const allowSysDev = '--allow-sys=osRelease,homedir,uid,gid,networkInterfaces';

    if (cmd === 'build') return common;
    if (cmd === 'dev') return ['--allow-env', '--allow-ffi', '--allow-read', allowSysDev, allowRun, allowWrite, allowNetDev];
    return common;
  },

  env(cwd: string) {
    return {
      ESBUILD_BINARY_PATH: wrangle.esbuildBinaryPath(cwd),
    } as const;
  },

  viteCacheDir(cwd: string) {
    const require = wrangle.esbuildRequire(cwd);
    const esbuildMain = require.resolve('esbuild');
    const [nodeModulesDir] = esbuildMain.split(/[\\/]\.deno[\\/]/);
    return Path.join(nodeModulesDir, '.vite');
  },

  async writeRoots(paths: t.ViteConfigPaths) {
    const roots = [paths.cwd, wrangle.viteCacheDir(paths.cwd)];
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

  esbuildBinaryPath(cwd: string) {
    const require = wrangle.esbuildRequire(cwd);
    const { pkg, subpath } = wrangle.esbuildPackage();
    try {
      return require.resolve(`${pkg}/${subpath}`);
    } catch {
      // Fall back to the Deno npm layout when the platform package is not linked directly.
    }

    const esbuildMain = require.resolve('esbuild');
    const denoNodeModules = Path.dirname(Path.dirname(Path.dirname(esbuildMain)));
    return Path.join(denoNodeModules, pkg, subpath);
  },

  requireFrom(start: string) {
    return createRequire(wrangle.packageAnchor(start));
  },

  moduleRequire() {
    if (!import.meta.url.startsWith('file:')) return null;
    return createRequire(import.meta.url);
  },

  esbuildRequire(cwd: string) {
    const consumer = wrangle.requireFrom(cwd);
    try {
      consumer.resolve('esbuild');
      return consumer;
    } catch {
      const local = wrangle.moduleRequire();
      if (local) return local;
      throw new Error(`Failed to resolve "esbuild" from consumer package boundary: ${cwd}`);
    }
  },

  packageAnchor(start: string) {
    let current = Path.resolve(start);

    while (true) {
      const path = Path.join(current, 'package.json');
      try {
        const stat = Deno.statSync(path);
        if (stat.isFile) return path;
      } catch {
        // Keep climbing until we find the consumer package boundary.
      }

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
