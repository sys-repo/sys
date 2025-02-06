import { type t, Esm, isEmptyObject, sortKeys } from './common.ts';

type D = { [key: string]: string };

/**
 * Convert deps to a `deno.json` format.
 */
export const toDenoJson: t.DenoDepsLib['toDenoJson'] = (deps) => {
  const imports: D = {};
  if (deps) {
    deps
      .filter((e) => !e.module.error)
      .filter((e) => e.target.includes('deno.json'))
      .forEach((e) => {
        const value = Esm.toString(e.module);
        imports[e.module.name] = value;
        if (e.wildcard) imports[`${e.module.name}/*`] = `${value}/*`;
      });
  }

  const res: t.PkgJsonDeno = {};
  if (!isEmptyObject(imports)) res.imports = sortKeys(imports);
  return res;
};
