import { Main } from '@sys/main/cmd';
import { type t, c, Fs, getWorkspaceModules, pkg, Pkg } from './common.ts';

/**
 * File processing rules for the template.
 */
export function createFileProcessor(args: t.ViteTmplCreateArgs): t.TmplProcessFile {
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
        .replace(/<ENTRY_SYS>/, `jsr:${Pkg.toString(Main.pkg)}`)
        .replace(/<SELF_IMPORT_URI>/, importUri)
        .replace(/<SELF_IMPORT_NAME>/, pkg.name);

      return e.modify(text);
    }

    if (e.target.relative === 'package.json') {
      const { modules } = await getWorkspaceModules();
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
    /**
     * NOTE: no "user-space" concept as of yet.
     * Example:
     *      contract: "anything hidden is not editable by user."
     */
    return false;
  },
} as const;
