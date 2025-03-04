import { type t, c, Cli, Esm, Fs, getWorkspaceModules, Semver } from './common.ts';

/**
 * Prepare the template with latest state, including making updates to deps/versions.
 */
export const prep: t.ViteTmplLib['prep'] = async (options = {}) => {
  const { modules } = await getWorkspaceModules();
  const path = './src/-tmpl/imports.json';
  const current = (await Fs.readJson<t.DenoImportMapJson>(path)).data;
  const imports = modules.latest(current?.imports ?? {});
  await Fs.writeJson(path, { ...current, imports });

  if (!options.silent) {
    const table = Cli.table([]);
    Object.entries(imports).forEach(([key, value]) => {
      const m = Esm.parse(value);
      const pkg = c.gray(`  ${key}`);
      const registry = c.gray(m.registry.toUpperCase());
      const version = Semver.Fmt.colorize(m.version);
      table.push([pkg, version, registry]);
    });

    console.info();
    console.info(c.italic(c.gray('imports.json')));
    console.info(c.brightGreen(`Dependencies:`));
    console.info(table.toString());
    console.info();
  }

  return { deps: imports };
};
