import { type t, Esm } from './common.ts';

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
      .forEach((e) => (imports[e.module.name] = Esm.toString(e.module)));
  }
  return { imports };
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
        const [scope, name] = mod.name.split('/');
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

  return { dependencies, devDependencies };
};
