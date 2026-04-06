import { type t, Fs, Is, Json, Obj, Path, isEmptyRecord } from './common.ts';
import { toDenoJson } from './u.toJson.deno.ts';

type DenoConfigJson = {
  importMap?: t.StringPath;
  imports?: Record<string, t.StringModuleSpecifier>;
} & t.JsonMap;

/**
 * Apply Deno imports onto a target `deno.json` file.
 */
export async function applyDeno(
  path: t.StringPath | undefined,
  entries?: t.EsmDeps.Entry[],
): Promise<t.EsmDeps.ApplyResult> {
  const loaded = await wrangle.loadDenoConfig(path);
  if (!loaded.ok || !loaded.data) throw new Error(`Failed to load deno file: ${loaded.path}`);

  const denoFilePath = loaded.path;
  const current = loaded;
  const denoJson = { ...current.data };
  const imports = Obj.sortKeys(toDenoJson(entries).imports ?? {});
  const hasImports = !isEmptyRecord(imports);

  if (Is.str(denoJson.importMap) && denoJson.importMap.length > 0) {
    const targetPath = Path.resolve(Fs.dirname(denoFilePath), denoJson.importMap);
    const currentImportMap = await Fs.readJson<t.Json>(targetPath);
    const nextImportMap: Record<string, t.Json> =
      currentImportMap.ok && Is.record<Record<string, t.Json>>(currentImportMap.data)
        ? { ...currentImportMap.data }
        : {};

    delete denoJson.imports;
    if (hasImports) nextImportMap.imports = imports;
    else delete nextImportMap.imports;

    await Fs.writeJson(denoFilePath, denoJson as t.Json);
    await Fs.writeJson(targetPath, nextImportMap as t.Json);

    return {
      kind: 'importMap',
      denoFilePath,
      targetPath,
      imports,
    };
  }

  if (hasImports) denoJson.imports = imports;
  else delete denoJson.imports;
  await Fs.writeJson(denoFilePath, denoJson as t.Json);

  return {
    kind: 'imports',
    denoFilePath,
    targetPath: denoFilePath,
    imports,
  };
}

/**
 * Helpers:
 */
const wrangle = {
  async loadDenoConfig(path?: t.StringPath) {
    path = Path.resolve(path ?? './deno.json');
    if (await Fs.Is.dir(path)) {
      const json = Fs.join(path, 'deno.json');
      const jsonc = Fs.join(path, 'deno.jsonc');
      if (await Fs.exists(json)) path = json;
      else if (await Fs.exists(jsonc)) path = jsonc;
      else path = json;
    }

    if (!path.endsWith('.jsonc')) return Fs.readJson<DenoConfigJson>(path);

    const res = await Fs.readText(path);
    if (!res.ok) {
      return {
        ok: false as const,
        exists: res.exists,
        path: res.path,
        errorReason: res.errorReason,
        error: res.error,
      };
    }

    const parsed = Json.safeParse<DenoConfigJson>(res.data, {}, { jsonc: true });
    if (!parsed.ok) {
      return {
        ok: false as const,
        exists: true as const,
        path: res.path,
        errorReason: 'ParseError' as const,
        error: parsed.error,
      };
    }

    return { ok: true as const, exists: true as const, path: res.path, data: parsed.data };
  },
} as const;
