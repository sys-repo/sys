import { type t, c, Cli, Esm, Fs, getWorkspaceModules, Semver } from './common.ts';

type O = Record<string, string>;

/**
 * Prepare the template with latest state, including making updates to deps/versions.
 */
export const prep: t.VitepressTmplLib['prep'] = async (options = {}) => {
  const { modules } = await getWorkspaceModules();
  let deps: O = {};

  const updateDenoJson = async () => {
    const path = './src/-tmpl/imports.json';
    const current = (await Fs.readJson<t.DenoImportMapJson>(path)).data;
    const imports = modules.latest(current?.imports ?? {});
    const next = { ...current, imports };
    await Fs.writeJson(path, next);
    deps = { ...deps, ...imports };
  };

  const updatePackageJson = async () => {
    const path = './src/-tmpl/package.json';
    const current = (await Fs.readJson<t.PkgJsonNode>(path)).data;
    const next: t.PkgJsonNode = {
      ...current,
      dependencies: modules.latest(current?.dependencies ?? {}),
      devDependencies: modules.latest(current?.devDependencies ?? {}),
    };

    await Fs.writeJson(path, next);
    deps = { ...deps, ...next.dependencies, ...next.devDependencies };
  };

  await updateDenoJson();
  await updatePackageJson();

  if (!options.silent) {
    const table = Cli.table([]);
    Object.entries(deps).forEach(([key, value]) => {
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

  return { deps };
};
