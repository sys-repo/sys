import { Perf } from '../../common/u.perf.ts';
import { Fs, Path, type t } from '../common.ts';
import { Bootstrap } from './u.bootstrap.ts';
import { pathsFromConfigfile } from './u.pathsFromConfigfile.ts';

/**
 * Helpers
 */
export const Wrangle = {
  async command(paths: t.ViteConfig.Paths, arg: string) {
    const end = Perf.section('wrangle.command', { cwd: paths.cwd, cmd: arg }, { level: 2 });
    const config = 'vite.config.ts';
    const env = wrangle.env(paths.cwd);
    const bootstrap = await Bootstrap.create(paths.cwd, await wrangle.viteSpecifier(paths.cwd));
    const args = await wrangle.args(paths, arg, config, bootstrap?.path);
    const cmd = ['deno', ...args].join(' ');
    end({ importMap: bootstrap?.path ?? '', argCount: args.length });
    return {
      cmd,
      args,
      env,
      dispose: async () => {
        await bootstrap?.cleanup();
      },
    } as const;
  },

  pathsFromConfigfile,

  async packageAnchor(start: string) {
    return await wrangle.packageAnchor(start);
  },

  async viteSpecifier(start: string, moduleUrl = import.meta.url) {
    return await wrangle.viteSpecifier(start, moduleUrl);
  },
} as const;

const wrangle = {
  async args(
    paths: t.ViteConfig.Paths,
    arg: string,
    config: string,
    importMap?: string,
  ) {
    const [cmd, ...rest] = arg.trim().split(/\s+/).filter(Boolean);
    const configLoader = await wrangle.configLoaderArg(paths.cwd);
    const permissions = await wrangle.permissions(paths, cmd ?? '', configLoader);
    const vite = await wrangle.viteSpecifier(paths.cwd);
    const outDir = cmd === 'build' ? `--outDir=${Path.resolve(paths.cwd, paths.app.outDir)}` : '';
    return [
      'run',
      '--no-prompt',
      ...permissions,
      '--node-modules-dir',
      importMap ? `--import-map=${importMap}` : '',
      vite,
      cmd,
      ...rest,
      configLoader,
      outDir,
      `--config=${config}`,
    ].filter(Boolean);
  },

  async permissions(paths: t.ViteConfig.Paths, cmd: string, configLoader: string) {
    const ffiRoots = await wrangle.ffiRoots(paths.cwd);
    const writeRoots = await wrangle.writeRoots(paths, cmd, configLoader);
    const allowEnv = '--allow-env';
    const allowFfi = `--allow-ffi=${ffiRoots.join(',')}`;
    const allowRun = `--allow-run=${Deno.execPath()}`;
    const allowWrite = `--allow-write=${writeRoots.join(',')}`;
    const allowSysCommon = '--allow-sys=osRelease,homedir,uid,gid';
    const allowNetBuild = '--allow-net=localhost';
    const allowNetLocal = '--allow-net=localhost,127.0.0.1,0.0.0.0,[::1],[::]';
    const common = [
      allowEnv,
      allowFfi,
      '--allow-read',
      allowSysCommon,
      allowRun,
      allowWrite,
    ];
    const allowSysDev = '--allow-sys=osRelease,homedir,uid,gid,networkInterfaces';

    // Vite 8 / rolldown build can issue a localhost DNS lookup under Deno during config/runtime startup.
    if (cmd === 'build') return [...common, allowNetBuild];
    if (cmd === 'dev') {
      return [
        allowEnv,
        allowFfi,
        '--allow-read',
        allowSysDev,
        allowRun,
        allowWrite,
        allowNetLocal,
      ];
    }
    return common;
  },

  async ffiRoots(cwd: string) {
    const anchor = await wrangle.packageAnchor(cwd);
    const root = Path.dirname(anchor);
    const canonicalRoot = await wrangle.tryRealPath(root);
    const roots = [root, canonicalRoot].filter(Boolean);
    return [...new Set(roots.map((path) => Path.join(path, 'node_modules', '.deno')))];
  },

  env(cwd: string) {
    const end = Perf.section('wrangle.env', { cwd }, { level: 2 });
    const env = { ...Perf.childEnv() } as const;
    end({ perf: Perf.enabled() });
    return env;
  },

  async viteSpecifier(start: string, moduleUrl = import.meta.url) {
    const end = Perf.section('wrangle.viteSpecifier', { start }, { level: 2 });
    const anchors = await wrangle.vitePackageAnchors(start, moduleUrl);

    let lastMissing = '';
    for (const anchor of anchors) {
      const version = await wrangle.viteVersionFromPackage(anchor);
      if (version) {
        const specifier = `npm:vite@${version}`;
        end({ anchors: anchors.length, specifier });
        return specifier;
      }
      lastMissing = anchor;
    }

    if (!lastMissing) {
      throw new Error(`Missing "vite" dependency in package authority: ${start}`);
    }

    end({ ok: false, anchors: anchors.length, lastMissing });
    throw new Error(`Missing "vite" dependency in package authority: ${lastMissing}`);
  },

  async viteVersionFromPackage(anchor: string) {
    const pkg = (await Fs.readJson<
      { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }
    >(
      anchor,
    )).data ?? {};
    return pkg.dependencies?.vite ?? pkg.devDependencies?.vite ?? '';
  },

  async configLoaderArg(cwd: string) {
    const end = Perf.section('wrangle.configLoaderArg', { cwd }, { level: 2 });
    const version = await wrangle.viteVersionFromPackage(await wrangle.packageAnchor(cwd));
    const arg = wrangle.viteMajor(version) >= 8 ? '--configLoader=native' : '';
    end({ version, arg });
    return arg;
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

  viteCacheDir(cwd: string) {
    return Path.join(Path.resolve(cwd), 'node_modules', '.vite');
  },

  viteConfigTempDir(cwd: string) {
    return Path.join(Path.resolve(cwd), 'node_modules', '.vite-temp');
  },

  async writeRoots(paths: t.ViteConfig.Paths, cmd: string, configLoader: string) {
    const output = Path.resolve(paths.cwd, paths.app.outDir);
    const cache = wrangle.viteCacheDir(paths.cwd);
    const configTemp = cmd === 'build' && !configLoader
      ? [wrangle.viteConfigTempDir(paths.cwd)]
      : [];
    const roots = cmd === 'build' ? [output, cache, ...configTemp] : [paths.cwd, output, cache];
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

  viteMajor(version: string) {
    const match = version.trim().match(/^[@~^<>=\s]*(\d+)/);
    return match ? Number(match[1]) : 0;
  },
} as const;
