import { type t, Fs } from './common.ts';

export async function readRepoAuthorities(
  root: t.StringAbsoluteDir,
): Promise<t.TmplTesting.LocalRepoAuthorities> {
  const imports = await readImportMap(Fs.join(root, 'imports.json'));
  const packageJson = await readPackageJson(Fs.join(root, 'package.json'));
  return { imports: imports.imports, packageJson };
}

export async function readImportMap(path: string): Promise<t.ImportMap> {
  const json = await readJson<t.Json>(path);
  const imports = (json as { imports?: unknown }).imports;
  if (!(imports && typeof imports === 'object')) {
    throw new Error(`Expected import map shape at ${path}`);
  }

  return { imports: imports as Record<string, string> };
}

export async function readPackageJson(path: string): Promise<t.PackageJson> {
  const json = await readJson<t.Json>(path);
  return json as t.PackageJson;
}

export async function readJson<T>(path: string): Promise<T> {
  const res = await Fs.readJson(path);
  if (!res.ok || !res.data) throw new Error(`Failed to read JSON: ${path}`);
  return res.data as T;
}
