import { type t, Fs, Is } from './common.ts';
import { resolvePackagePaths } from '../m.pkg/u.source.ts';

export async function collectPackages(cwd: t.StringDir, source: t.WorkspaceGraph.PackageSource) {
  const packagePaths = await resolvePackagePaths(cwd, source);
  const packages = await Promise.all(
    packagePaths.map(async (packagePath) => {
      const manifestPath = Fs.join(packagePath, 'deno.json');
      const deno = (await Fs.readJson<Record<string, unknown>>(manifestPath)).data ?? {};
      return {
        path: toRelative(cwd, packagePath),
        manifestPath: toRelative(cwd, manifestPath),
        name: Is.str(deno.name) && deno.name.trim() ? deno.name : undefined,
        entryPaths: await resolveEntryPaths(cwd, packagePath, deno),
      } satisfies t.WorkspaceGraph.Package;
    }),
  );

  return packages.toSorted((a, b) => a.path.localeCompare(b.path));
}

async function resolveEntryPaths(
  cwd: t.StringDir,
  packagePath: t.StringPath,
  deno: Record<string, unknown>,
) {
  const explicit = exportPaths(deno.exports)
    .map((path) => Fs.resolve(packagePath, path))
    .filter((path, index, values) => values.indexOf(path) === index);

  const existing: string[] = [];
  for (const path of explicit) {
    if (await Fs.exists(path)) existing.push(toRelative(cwd, path));
  }
  if (existing.length > 0) return existing.toSorted();

  const fallback: string[] = [];
  for (const rel of ['./src/mod.ts', './mod.ts'] as const) {
    const path = Fs.resolve(packagePath, rel);
    if (await Fs.exists(path)) fallback.push(toRelative(cwd, path));
  }

  return fallback.toSorted();
}

function exportPaths(input: unknown): string[] {
  if (Is.str(input)) return input.startsWith('.') ? [input] : [];
  if (!input || typeof input !== 'object') return [];
  return Object.values(input).flatMap((value) => exportPaths(value));
}

function toRelative(cwd: string, path: string) {
  return Fs.Path.relative(cwd, path).replaceAll('\\', '/');
}
