import { type t, Fs } from '../-test.ts';

export async function poisonSysVersions(
  root: string,
  packages: readonly string[],
  version = '999.0.0',
) {
  const path = Fs.join(root, 'imports.json');
  const current = await readImportMap(path);
  const next = structuredClone(current);

  for (const [key, value] of Object.entries(next.imports)) {
    const pkg = packages.find((item) => key === item || key.startsWith(`${item}/`));
    if (!pkg) continue;

    const suffix = key.slice(pkg.length);
    const nextValue = `jsr:${pkg}@${version}${suffix}`;
    next.imports[key] = value.startsWith('jsr:') ? nextValue : value;
  }

  await Fs.writeJson(path, next);
}
async function readImportMap(path: string) {
  const json = await readJson<t.Json>(path);
  const imports = (json as { imports?: unknown }).imports;
  if (!imports || typeof imports !== 'object') {
    throw new Error(`Expected import map shape at ${path}`);
  }

  return { imports: imports as Record<string, string> };
}

async function readJson<T>(path: string): Promise<T> {
  const res = await Fs.readJson(path);
  if (!res.ok || !res.data) throw new Error(`Failed to read JSON: ${path}`);
  return res.data as T;
}
