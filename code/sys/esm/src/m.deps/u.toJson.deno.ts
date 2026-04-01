import { type t, Esm, Obj, isEmptyRecord } from './common.ts';

type Imports = Record<string, string>;

/**
 * Convert canonical dependency entries to a `deno.json` import map shape.
 */
export function toDenoJson(entries?: t.EsmDeps.Entry[]): t.PkgJsonDeno {
  const imports: Imports = {};
  if (entries) {
    entries
      .filter((entry) => !entry.module.error)
      .filter((entry) => entry.target.includes('deno.json'))
      .forEach((entry) => {
        const value = Esm.toString(entry.module);
        const name = entry.module.alias || entry.module.name;
        imports[name] = value;
        if (Array.isArray(entry.subpaths)) {
          entry.subpaths.forEach((subpath) => {
            imports[`${name}/${subpath}`] = `${value}/${subpath}`;
          });
        }
      });
  }

  const json: t.PkgJsonDeno = {};
  if (!isEmptyRecord(imports)) json.imports = Obj.sortKeys(imports);
  return json;
}
