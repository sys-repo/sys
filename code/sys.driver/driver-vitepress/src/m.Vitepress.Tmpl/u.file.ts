import { pkg as pkgDeno } from '@sys/driver-deno';
import { pkg as pkgVite } from '@sys/driver-vite';
import { Main } from '@sys/main/cmd';
import { type t, c, DenoDeps, Esm, Fs, PATHS, pkg, Pkg } from './common.ts';

/**
 * File processing rules for the template.
 */
export function createFileProcessor(args: t.VitepressTmplCreateArgs): t.TmplProcessFile {
  const { srcDir = PATHS.srcDir } = args;

  const getDeps = async (base: t.StringDir) => {
    const from = DenoDeps.from;
    const join = (...parts: string[]) => Fs.join(base, ...parts);
    const load = async (path: string) => (await from(join(path))).data?.modules.items ?? [];

    const m1 = await load('.sys/deps.yaml');
    const m2 = await load('.sys/deps.sys.yaml');
    const modules = Esm.modules([...m1, ...m2]);

    return { modules };
  };

  return async (e) => {
    if (e.target.exists && is.userspace(e.target.relative)) {
      /**
       *  🫵  DO NOT adjust user generated
       *     content after the initial creation.
       */
      return e.exclude('user-space');
    }

    if (e.target.relative === 'deno.json') {
      /**
       * Update versions in `deno.json`:
       */
      const version = args.version ?? pkg.version;
      const importUri = `jsr:${pkg.name}@${version}`;
      const text = e.text.tmpl
        .replace(/<ENTRY>/g, `${importUri}/main`)
        .replace(/<ENTRY_MAIN>/, `jsr:${Pkg.toString(Main.pkg)}`)
        .replace(/<DRIVER_DENO>/, `jsr:${Pkg.toString(pkgDeno)}`)
        .replace(/<DRIVER_VITE>/, `jsr:${Pkg.toString(pkgVite)}`)
        .replace(/<DRIVER_VITEPRESS>/, `jsr:${Pkg.toString(pkg)}`);

      return e.modify(text);
    }

    if (e.target.relative === 'package.json') {
      const { modules } = await getDeps(e.target.base);
      const pkg = (await Fs.readJson<t.PkgJsonNode>(e.tmpl.absolute)).data;
      const next = {
        ...pkg,
        dependencies: modules.latest(pkg?.dependencies ?? {}),
        devDependencies: modules.latest(pkg?.devDependencies ?? {}),
      };

      console.info(c.gray(`Resolved versions:`));
      console.info(c.brightCyan(c.bold(`./package.json:`)));
      console.info(next);
      console.info();

      const json = `${JSON.stringify(next, null, '  ')}\n`;
      return e.modify(json);
    }

    if (e.target.relative === 'docs/index.md') {
      const text = e.text.tmpl.replace(/\<DRIVER_VER\>/g, pkg.version);
      return e.modify(text);
    }

    if (e.target.relative === '.vitepress/config.ts') {
      /**
       * Content Source ("src").
       * Markdown and Image files
       * Docs:
       *       https://vitepress.dev/reference/site-config#srcdir
       */
      const text = e.text.tmpl.replace(/<SRC_DIR>/, srcDir);
      return e.modify(text);
    }

    if (e.target.file.name === '.gitignore-') {
      /**
       * Rename to ".gitignore"
       * NB: This ensure the template files themselves are not ignored within the mono-repo
       *     but initiating "consumer" module does have a proper `.gitignore` file.
       */
      e.rename('.gitignore');
    }
  };
}

/**
 * Helpers
 */
const is = {
  withinHiddenDir(path: string): boolean {
    const dirs = path.split('/').slice(0, -1);
    return dirs.some((dir) => dir.startsWith('.'));
  },
  userspace(path: string): boolean {
    if (is.withinHiddenDir(path)) return false; // NB: contract: "anything hidden is not editable by user."
    const NOT_USERSPACE = ['deno.json', 'package.json', '.npmrc', '.gitignore'];
    const isExcluded = NOT_USERSPACE.some((m) => path.split('/').slice(-1)[0] === m);
    return !isExcluded;
  },
} as const;
