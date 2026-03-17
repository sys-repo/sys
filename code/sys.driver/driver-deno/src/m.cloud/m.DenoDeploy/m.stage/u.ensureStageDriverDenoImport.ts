import { type t, Fs, Is, Obj, Path, pkg } from './common.ts';

type O = Record<string, string>;
type ImportMapJson = { readonly imports?: O };

export async function ensureStageDriverDenoImport(root: t.StringDir) {
  const denoPath = Fs.join(root, 'deno.json');
  const deno = await Fs.readJson<Record<string, unknown>>(denoPath);
  if (!deno.ok || !deno.data) throw new Error(`Failed to read staged deno.json: ${denoPath}`);

  const imports = stageDriverDenoImports();
  const current = deno.data;
  const importMap = current.importMap;

  if (Is.str(importMap) && importMap.trim().length > 0) {
    const targetPath = Path.resolve(root, importMap);
    const currentMap = await Fs.readJson<ImportMapJson>(targetPath);
    const nextImports = Obj.sortKeys({
      ...(currentMap.ok && currentMap.data?.imports ? currentMap.data.imports : {}),
      ...imports,
    });

    await Fs.writeJson(targetPath, {
      ...(currentMap.ok && currentMap.data ? currentMap.data : {}),
      imports: nextImports,
    });
    return;
  }

  const currentImports = Is.record<O>(current.imports) ? current.imports : {};

  await Fs.writeJson(denoPath, {
    ...current,
    imports: Obj.sortKeys({ ...currentImports, ...imports }),
  });
}

function stageDriverDenoImports() {
  const spec = `jsr:@sys/driver-deno@${pkg.version}`;
  return {
    '@sys/driver-deno': spec,
    '@sys/driver-deno/cloud': `${spec}/cloud`,
  } as const;
}
