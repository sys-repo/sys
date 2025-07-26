import { type t, Esm, isEmptyRecord, Obj } from './common.ts';

type D = { [key: string]: string };

/**
 * Convert deps to a `deno.json` format.
 */
export function toDenoJson(deps?: t.Dep[]): t.PkgJsonDeno {
  const imports: D = {};
  if (deps) {
    deps
      .filter((e) => !e.module.error)
      .filter((e) => e.target.includes('deno.json'))
      .forEach((e) => {
        const value = Esm.toString(e.module);
        const name = e.module.alias || e.module.name;
        imports[name] = value;
        if (e.wildcard) imports[`${name}/*`] = `${value}/*`;
        if (Array.isArray(e.subpaths)) {
          e.subpaths.forEach((subpath) => {
            imports[`${name}/${subpath}`] = `${value}/${subpath}`;
          });
        }
      });
  }

  const res: t.PkgJsonDeno = {};
  if (!isEmptyRecord(imports)) res.imports = Obj.sortKeys(imports);
  return res;
}
