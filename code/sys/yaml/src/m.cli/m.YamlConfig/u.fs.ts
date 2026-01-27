import { type t, Fs, Yaml, DEFAULT } from './common.ts';
import { type YamlConfigSchema } from './t.menu.ts';

export async function ensureConfigDir(cwd: t.StringDir, dir: t.StringPath): Promise<t.StringDir> {
  const abs = Fs.join(cwd, dir);
  await Fs.ensureDir(abs);
  return abs;
}

export async function listConfigs(
  dir: t.StringDir,
  ext: string = DEFAULT.EXT,
): Promise<t.StringFile[]> {
  const paths: t.StringFile[] = [];
  for await (const entry of Deno.readDir(dir)) {
    if (!entry.isFile) continue;
    if (!entry.name.endsWith(ext)) continue;
    paths.push(Fs.join(dir, entry.name));
  }
  return paths;
}

export async function ensureDefaultConfig<T>(
  dir: t.StringDir,
  schema: YamlConfigSchema<T>,
  name: string = DEFAULT.NAME,
  ext: string = DEFAULT.EXT,
): Promise<t.StringFile> {
  const path = Fs.join(dir, fileOf(name, ext));
  await ensureInitialYaml(path, schema);
  return path;
}

export async function ensureInitialYaml<T>(path: t.StringFile, schema: YamlConfigSchema<T>) {
  if (await Fs.exists(path)) return;
  await writeYaml(path, schema.init(), schema);
}

export function fileLabel(path: t.StringPath, ext: string = DEFAULT.EXT): string {
  return stripExt(Fs.basename(path), ext);
}

export function fileOf(name: string, ext: string = DEFAULT.EXT): string {
  let base = name.trim();
  if (base.endsWith(ext)) base = base.slice(0, -ext.length);
  return `${base}${ext}`;
}

export async function validateYaml<T>(
  path: t.StringFile,
  schema: YamlConfigSchema<T>,
): Promise<{ ok: boolean; errors: readonly unknown[] }> {
  const res = await Fs.readYaml<T>(path);
  if (!res.ok || !res.exists) return { ok: false, errors: [] };
  return schema.validate(res.data);
}

export async function readYaml<T>(path: t.StringFile): Promise<T | undefined> {
  const res = await Fs.readYaml<T>(path);
  return res.ok ? res.data : undefined;
}

export async function writeYaml<T>(path: t.StringFile, doc: T, schema: YamlConfigSchema<T>) {
  const text = schema.stringifyYaml ? schema.stringifyYaml(doc) : (Yaml.stringify(doc).data ?? '');
  await Fs.write(path, text);
}

function stripExt(name: string, ext: string): string {
  return name.endsWith(ext) ? name.slice(0, -ext.length) : name;
}

export { DEFAULT } from './common.ts';
