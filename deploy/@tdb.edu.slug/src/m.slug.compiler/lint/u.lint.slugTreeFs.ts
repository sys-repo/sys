import { type t, Fs } from './common.ts';

export const LINT_PROFILE_DIR = '-slug.lint';
export const LINT_PROFILE_EXT = '.yaml';
export const LINT_PROFILE_DEFAULT_NAME = 'default.yaml';
export const LINT_PROFILE_DEFAULT_YAML = '# slug lint profile\n';

export async function ensureProfileDir(cwd: t.StringDir): Promise<t.StringDir> {
  const dir = Fs.join(cwd, LINT_PROFILE_DIR);
  await Fs.ensureDir(dir);
  return dir;
}

export async function listProfiles(dir: t.StringDir): Promise<t.StringFile[]> {
  const paths: t.StringFile[] = [];
  for await (const entry of Deno.readDir(dir)) {
    if (!entry.isFile) continue;
    if (!entry.name.endsWith(LINT_PROFILE_EXT)) continue;
    paths.push(Fs.join(dir, entry.name));
  }
  return paths;
}

export async function ensureDefaultProfile(dir: t.StringDir): Promise<t.StringFile> {
  const path = Fs.join(dir, LINT_PROFILE_DEFAULT_NAME);
  await Fs.write(path, LINT_PROFILE_DEFAULT_YAML);
  return path;
}

export function profileLabel(path: t.StringPath): string {
  return stripExt(Fs.basename(path));
}

export function profileFileOf(name: string): string {
  let base = name.trim();
  if (base.endsWith(LINT_PROFILE_EXT)) base = base.slice(0, -LINT_PROFILE_EXT.length);
  return `${base}${LINT_PROFILE_EXT}`;
}

function stripExt(name: string): string {
  return name.endsWith(LINT_PROFILE_EXT) ? name.slice(0, -LINT_PROFILE_EXT.length) : name;
}
