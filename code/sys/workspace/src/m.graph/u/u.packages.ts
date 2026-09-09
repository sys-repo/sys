import { Fs, Is, Obj, Str, type t } from '../common.ts';
import { resolvePackagePaths } from '../../m.pkg/u.source.ts';
import { classifyModuleSpecifier } from './u.moduleSpecifier.ts';

const compare = Str.Compare.codeUnit();

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

  return packages.toSorted((a, b) => compare(a.path, b.path));
}

async function resolveEntryPaths(
  cwd: t.StringDir,
  packagePath: t.StringPath,
  deno: Record<string, unknown>,
) {
  const exported = exportPaths(deno.exports);
  const explicit = [
    ...new Set(
      exported
        .filter((path) => classifyModuleSpecifier(path) === 'code-module')
        .map((path) => Fs.resolve(packagePath, path)),
    ),
  ];

  const existing: string[] = [];
  for (const path of explicit) {
    if (await Fs.exists(path)) existing.push(toRelative(cwd, path));
  }
  if (existing.length > 0) return existing.toSorted(compare);
  if (exported.length > 0 && explicit.length === 0) return [];

  const fallback: string[] = [];
  for (const rel of ['./src/mod.ts', './mod.ts'] as const) {
    const path = Fs.resolve(packagePath, rel);
    if (await Fs.exists(path)) fallback.push(toRelative(cwd, path));
  }

  return fallback.toSorted(compare);
}

function exportPaths(input: unknown): string[] {
  if (Is.str(input)) return input.startsWith('.') ? [input] : [];
  if (!Is.record(input)) return [];
  return Obj.entries(input).flatMap(([, value]) => exportPaths(value));
}

function toRelative(cwd: string, path: string) {
  return Fs.Path.relative(cwd, path).replaceAll('\\', '/');
}
