import { type t, isEmptyRecord, sortKeys } from './common.ts';

type D = { [key: string]: string };

/**
 * Convert deps to a `package.json` format.
 */
export function toPackageJson(deps?: t.DenoDep[]): t.PkgJsonNode {
  const dependencies: D = {};
  const devDependencies: D = {};

  if (deps) {
    const imports = deps
      .filter((e) => !e.module.error)
      .filter((e) => e.target.includes('package.json'));

    const toString = (mod: t.EsmImport) => {
      if (mod.prefix === 'jsr') {
        const split = mod.name.split('/');
        const scope = split[0].replace(/^\@/, '');
        const name = split[1];
        return `npm:@jsr/${scope}__${name}@${mod.version}`;
      } else {
        return mod.version;
      }
    };

    imports
      .filter((e) => !e.dev)
      .forEach((e) => (dependencies[e.module.name] = toString(e.module)));

    imports
      .filter((e) => !!e.dev)
      .forEach((e) => (devDependencies[e.module.name] = toString(e.module)));
  }

  const res: t.PkgJsonNode = {};
  if (!isEmptyRecord(dependencies)) res.dependencies = sortKeys(dependencies);
  if (!isEmptyRecord(devDependencies)) res.devDependencies = sortKeys(devDependencies);
  return res;
}
