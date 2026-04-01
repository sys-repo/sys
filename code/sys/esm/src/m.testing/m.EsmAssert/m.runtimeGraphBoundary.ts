import { type t, Fs, Path } from './common.ts';

export const runtimeGraphBoundary: t.EsmAssert.RuntimeGraph.Boundary = async (options) => {
  const seen = new Set<string>();
  const queue = [Path.resolve(options.entry)];
  const forbiddenImports = new Set(options.forbiddenImports ?? []);
  const forbiddenPathIncludes = options.forbiddenPathIncludes ?? [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || seen.has(current)) continue;
    seen.add(current);

    const text = await Fs.readText(current);
    if (!text.ok) {
      const err = `EsmAssert.runtimeGraphBoundary: failed to read '${current}'.`;
      throw new Error(err);
    }
    const src = text.data ?? '';

    for (const spec of forbiddenImports) {
      if (src.includes(spec)) {
        const err = `EsmAssert.runtimeGraphBoundary: forbidden import '${spec}' found in '${current}'.`;
        throw new Error(err);
      }
    }

    for (const spec of runtimeImportSpecifiers(src)) {
      if (forbiddenImports.has(spec)) {
        const err = `EsmAssert.runtimeGraphBoundary: forbidden import '${spec}' found in '${current}'.`;
        throw new Error(err);
      }
      if (!spec.startsWith('.')) continue;

      const resolved = await resolveLocalModule(current, spec);
      if (!resolved) {
        const err = `EsmAssert.runtimeGraphBoundary: failed to resolve local module '${spec}' from '${current}'.`;
        throw new Error(err);
      }

      for (const pattern of forbiddenPathIncludes) {
        if (resolved.includes(pattern)) {
          const err = `EsmAssert.runtimeGraphBoundary: forbidden path '${pattern}' reached at '${resolved}'.`;
          throw new Error(err);
        }
      }

      queue.push(resolved);
    }
  }
};

/**
 * Helpers:
 */
async function resolveLocalModule(from: string, spec: string): Promise<string | undefined> {
  const base = Path.resolve(Path.dirname(from), spec);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, Path.join(base, 'mod.ts')];

  for (const candidate of candidates) {
    if (!(await Fs.exists(candidate))) continue;
    if (await Fs.Is.file(candidate)) return candidate;
  }

  return undefined;
}

function runtimeImportSpecifiers(src: string): string[] {
  const matchAll = (line: string) =>
    Array.from(line.matchAll(/(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g));

  return src
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !line.startsWith('import type '))
    .filter((line) => !line.startsWith('export type '))
    .flatMap(matchAll)
    .map((match) => match[1]);
}
