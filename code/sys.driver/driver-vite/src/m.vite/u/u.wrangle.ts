import { Perf } from '../../common/u.perf.ts';
import { Fs, Path, type t } from '../common.ts';
import { Bootstrap } from './u.bootstrap.ts';
import { pathsFromConfigfile } from './u.pathsFromConfigfile.ts';

/** Resolve Vite and prepare child-process commands. */
export const Wrangle = {
  async command(
    paths: t.ViteConfig.Paths,
    arg: string,
    dependencyPolicy?: t.Vite.Build.Args['dependencyPolicy'],
  ) {
    const end = Perf.section('wrangle.command', { cwd: paths.cwd, cmd: arg }, { level: 2 });
    const config = 'vite.config.ts';
    const env = wrangle.env(paths.cwd);
    // Use the same Vite package for the executable, config loader, and import map.
    const vite = await wrangle.viteSpecifier(paths.cwd);
    const bootstrap = await Bootstrap.create(paths.cwd, vite);
    const args = wrangle.args(paths, arg, config, vite, bootstrap?.path, dependencyPolicy);
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
  args(
    paths: t.ViteConfig.Paths,
    arg: string,
    config: string,
    vite: string,
    importMap?: string,
    dependencyPolicy?: t.Vite.Build.Args['dependencyPolicy'],
  ) {
    const [cmd, ...rest] = arg.trim().split(/\s+/).filter(Boolean);
    const configLoader = wrangle.configLoaderArg(vite);
    const outDir = cmd === 'build' ? `--outDir=${Path.resolve(paths.cwd, paths.app.outDir)}` : '';
    const base = cmd === 'build' ? `--base=${paths.app.base}` : '';
    return [
      'run',
      '--no-prompt',
      ...(dependencyPolicy === 'frozen-cache' ? ['--frozen', '--cached-only'] : []),
      '-A',
      '--node-modules-dir',
      importMap ? `--import-map=${importMap}` : '',
      vite,
      cmd,
      ...rest,
      configLoader,
      outDir,
      base,
      `--config=${config}`,
    ].filter(Boolean);
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

  configLoaderArg(vite: string) {
    const end = Perf.section('wrangle.configLoaderArg', { vite }, { level: 2 });
    const version = vite.slice('npm:vite@'.length);
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
