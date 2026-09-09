import { describe, expect, it, Path } from '../../-test.ts';

const SRC = Path.resolve(import.meta.dirname ?? '.', '../..');
const ROOTS = ['m.files', 'm.files.fs', 'm.files.memory', 'm.files.static'] as const;
const ALLOWED = new Set([
  'm.files.static/t.ts',
  'm.files.static/m.fromDist.ts',
  'm.files.static/u/u.index.ts',
]);
const FORBIDDEN = [
  'DistPkg',
  'Pkg.Dist',
  'Pkg.Is.dist',
  'dist.hash.parts',
  'PkgDist',
  '@sys/fs/pkg',
] as const;

describe('FilesStatic DistPkg seam', () => {
  it('confines dist package coupling to the static Files seam', async () => {
    const violations: string[] = [];

    for (const path of await productionFiles()) {
      const rel = relative(path);
      if (ALLOWED.has(rel)) continue;

      const source = await Deno.readTextFile(path);
      for (const token of FORBIDDEN) {
        if (source.includes(token)) violations.push(`${rel} → ${token}`);
      }
    }

    expect(violations.sort()).to.eql([]);
  });
});

/**
 * Helpers:
 */
async function productionFiles(): Promise<string[]> {
  const files: string[] = [];
  for (const root of ROOTS) await collect(Path.join(SRC, root), files);
  return files.sort((a, b) => a.localeCompare(b));
}

async function collect(dir: string, files: string[]): Promise<void> {
  for await (const entry of Deno.readDir(dir)) {
    if (entry.name === '-test') continue;
    const path = Path.join(dir, entry.name);

    if (entry.isDirectory) {
      await collect(path, files);
    } else if (entry.isFile && entry.name.endsWith('.ts')) {
      files.push(path);
    }
  }
}

function relative(path: string): string {
  const prefix = `${SRC}/`;
  if (!path.startsWith(prefix)) throw new Error(`Unexpected source path: ${path}`);
  return path.slice(prefix.length);
}
