import { type t, Fs, Is, Obj, Path, isEmptyRecord } from '../common.ts';
import { DenoDeps } from '../m.DenoDeps/mod.ts';
import { DenoFile } from '../m.DenoFile/mod.ts';
import type { DenoImports } from './t.ts';

/**
 * Reconcile canonical Deno imports onto a target `deno.json` file.
 *
 * If the target config declares `importMap`, that referenced file is treated
 * as authoritative and updated. Otherwise imports are written inline to the
 * `deno.json` file itself.
 */
export async function applyDenoImports(
  path: t.StringPath | undefined,
  deps?: t.Dep[],
): Promise<DenoImports.ApplyResult> {
  const res = await DenoFile.load(path);
  if (!res.ok || !res.exists || !res.data) {
    const target = path ?? './deno.json';
    throw new Error(`Failed to load deno file: ${target}`);
  }

  const denoFilePath = res.path;
  const denoJson = { ...res.data };
  const imports = Obj.sortKeys(DenoDeps.toJson('deno.json', deps).imports ?? {});
  const hasImports = !isEmptyRecord(imports);

  if (typeof denoJson.importMap === 'string' && denoJson.importMap.length > 0) {
    const targetPath = Path.resolve(Fs.dirname(denoFilePath), denoJson.importMap);
    const currentImportMap = await Fs.readJson<t.Json>(targetPath);
    const nextImportMap: Record<string, t.Json> =
      currentImportMap.ok && Is.record<Record<string, t.Json>>(currentImportMap.data)
        ? { ...currentImportMap.data }
        : {};

    delete denoJson.imports;
    if (hasImports) nextImportMap.imports = imports;
    else delete nextImportMap.imports;

    await Fs.writeJson(denoFilePath, denoJson);
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
  await Fs.writeJson(denoFilePath, denoJson);

  return {
    kind: 'imports',
    denoFilePath,
    targetPath: denoFilePath,
    imports,
  };
}
