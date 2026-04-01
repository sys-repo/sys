import { expect, Fs, Path } from './mod.ts';

export type GraphBoundaryOptions = {
  readonly entry: string;
  readonly forbiddenImports?: readonly string[];
  readonly forbiddenPathIncludes?: readonly string[];
};

export async function assertRuntimeGraphBoundary(args: GraphBoundaryOptions) {
  const seen = new Set<string>();
  const queue = [Path.resolve(args.entry)];
  const forbiddenImports = new Set(args.forbiddenImports ?? []);
  const forbiddenPathIncludes = args.forbiddenPathIncludes ?? [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || seen.has(current)) continue;
    seen.add(current);

    const text = await Fs.readText(current);
    expect(text.ok).to.eql(true);
    const src = text.data ?? '';

    for (const spec of forbiddenImports) {
      expect(src).to.not.include(spec);
    }

    for (const spec of runtimeImportSpecifiers(src)) {
      expect(forbiddenImports.has(spec)).to.eql(false);
      if (!spec.startsWith('.')) continue;

      const resolved = await resolveLocalModule(current, spec);
      expect(resolved).to.not.eql(undefined);
      if (!resolved) continue;

      for (const pattern of forbiddenPathIncludes) {
        expect(resolved).to.not.include(pattern);
      }

      queue.push(resolved);
    }
  }
}

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
  return src
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !line.startsWith('import type '))
    .filter((line) => !line.startsWith('export type '))
    .flatMap((line) =>
      Array.from(line.matchAll(/(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g)),
    )
    .map((match) => match[1]);
}
