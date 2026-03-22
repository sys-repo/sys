import { Fs, type t } from './common.ts';

const EXCLUDE = ['**/.tmp/**', '**/node_modules/**', '**/src/-test/**'] as const;

/**
 * Discover package roots by matching explicit `deno.json` include globs.
 */
export async function resolvePackagePaths(
  cwd: t.StringDir,
  source: t.WorkspacePkg.Source,
): Promise<readonly t.StringPath[]> {
  const glob = Fs.glob(cwd, { includeDirs: false });
  const seen = new Set<string>();
  const packages: string[] = [];

  for (const include of source.include) {
    const entries = await glob.find(include, { exclude: [...EXCLUDE] });
    for (const entry of entries) {
      if (Fs.Path.basename(entry.path) !== 'deno.json') continue;
      const packagePath = Fs.dirname(entry.path);
      if (seen.has(packagePath)) continue;
      seen.add(packagePath);
      packages.push(packagePath);
    }
  }

  return packages;
}
