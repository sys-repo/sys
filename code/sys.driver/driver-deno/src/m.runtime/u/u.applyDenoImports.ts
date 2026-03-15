import { type t, Fs, Obj, Path } from '../common.ts';
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

  if (typeof denoJson.importMap === 'string' && denoJson.importMap.length > 0) {
    const targetPath = Path.resolve(Fs.dirname(denoFilePath), denoJson.importMap);
    delete denoJson.imports;

    await Fs.writeJson(denoFilePath, denoJson);
    await Fs.writeJson(targetPath, { imports });

    return {
      kind: 'importMap',
      denoFilePath,
      targetPath,
      imports,
    };
  }

  denoJson.imports = imports;
  await Fs.writeJson(denoFilePath, denoJson);

  return {
    kind: 'imports',
    denoFilePath,
    targetPath: denoFilePath,
    imports,
  };
}
