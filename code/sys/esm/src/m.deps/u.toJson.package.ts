import { type t, Obj, isEmptyRecord } from './common.ts';

type Dependencies = Record<string, string>;

/**
 * Convert canonical dependency entries to a `package.json` dependency shape.
 */
export function toPackageJson(entries?: t.EsmDeps.Entry[]): t.PkgJsonNode {
  const dependencies: Dependencies = {};
  const devDependencies: Dependencies = {};

  if (entries) {
    const pkgEntries = entries
      .filter((entry) => !entry.module.error)
      .filter((entry) => entry.target.includes('package.json'));

    const toSpecifier = (module: t.EsmImport) => {
      if (module.registry === 'jsr') {
        const split = module.name.split('/');
        const scope = split[0].replace(/^\@/, '');
        const name = split[1];
        return `npm:@jsr/${scope}__${name}@${module.version}`;
      }

      return module.version;
    };

    pkgEntries
      .filter((entry) => !entry.dev)
      .forEach((entry) => (dependencies[entry.module.name] = toSpecifier(entry.module)));

    pkgEntries
      .filter((entry) => !!entry.dev)
      .forEach((entry) => (devDependencies[entry.module.name] = toSpecifier(entry.module)));
  }

  const json: t.PkgJsonNode = {};
  if (!isEmptyRecord(dependencies)) json.dependencies = Obj.sortKeys(dependencies);
  if (!isEmptyRecord(devDependencies)) json.devDependencies = Obj.sortKeys(devDependencies);
  return json;
}
