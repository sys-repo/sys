import { type t, Fs, Is, Obj, Path, pkg } from './common.ts';

type O = Record<string, string>;
type ImportMapJson = { readonly imports?: O };
type DenoJson = Record<string, unknown>;

export async function ensureStageDriverDenoImport(
  root: t.StringDir,
  retain?: ReadonlySet<t.StringPath>,
) {
  const denoPath = Fs.join(root, 'deno.json');
  const deno = await Fs.readJson<DenoJson>(denoPath);
  if (!deno.ok || !deno.data) throw new Error(`Failed to read staged deno.json: ${denoPath}`);

  const imports = await stageImports(root, retain ?? new Set());
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

async function stageImports(root: t.StringDir, retain: ReadonlySet<t.StringPath>) {
  const local = await localWorkspaceImports(root, retain);
  const spec = `jsr:@sys/driver-deno@${pkg.version}`;
  return {
    '@sys/driver-deno': local['@sys/driver-deno'] ?? spec,
    '@sys/driver-deno/cloud': local['@sys/driver-deno/cloud'] ?? `${spec}/cloud`,
    ...local,
  } as const;
}

async function localWorkspaceImports(root: t.StringDir, retain: ReadonlySet<t.StringPath>) {
  const imports: Record<string, string> = {};

  for (const dir of retain) {
    const path = Fs.join(root, dir, 'deno.json');
    const deno = await Fs.readJson<DenoJson>(path);
    if (!deno.ok || !deno.data) continue;

    const name = Is.str(deno.data.name) ? deno.data.name : undefined;
    if (!name || name.trim().length === 0) continue;

    const exports = Is.record<Record<string, string>>(deno.data.exports) ? deno.data.exports : {};
    for (const [key, target] of Object.entries(exports)) {
      if (!Is.str(target) || target.trim().length === 0) continue;
      const specifier = key === '.' ? name : `${name}/${key.replace(/^\.\//, '')}`;
      imports[specifier] = toDotRelative(Path.relative(root, Fs.join(root, dir, target)));
    }
  }

  return imports;
}

function toDotRelative(path: string) {
  const normalized = path.replaceAll('\\', '/');
  return normalized.startsWith('./') || normalized.startsWith('../')
    ? normalized
    : `./${normalized}`;
}
