import { type t, Esm } from './common.ts';

type O = Record<string, unknown>;
type D = { [key: string]: string };

/**
 * Convert deps to a `deno.json` format.
 */
export const toDenoJson: t.DenoDepsLib['toDenoJson'] = (input) => {
  const imports: D = {};
  if (input) {
    input.imports
      .filter((e) => !e.module.error)
      .filter((e) => e.target.includes('deno.json'))
      .forEach((e) => {
        const value = Esm.toString(e.module);
        imports[e.module.name] = value;
        if (e.wildcard) imports[`${e.module.name}/*`] = `${value}/*`;
      });
  }

  const res: t.PkgJsonDeno = {};
  if (!isEmpty(imports)) res.imports = imports;
  return res;
};

/**
 * Convert deps to a `package.json` format.
 */
export const toPackageJson: t.DenoDepsLib['toPackageJson'] = (input) => {
  const dependencies: D = {};
  const devDependencies: D = {};

  if (input) {
    const imports = input.imports
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
  if (!isEmpty(dependencies)) res.dependencies = dependencies;
  if (!isEmpty(devDependencies)) res.devDependencies = devDependencies;
  return res;
};

/**
 * Helpers
 */
function isEmpty(input: O) {
  return Object.keys(input).length === 0;
}
