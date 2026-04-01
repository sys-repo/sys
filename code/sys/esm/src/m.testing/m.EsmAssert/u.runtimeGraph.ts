import { Fs, Path } from './common.ts';

export type RuntimeGraphScanOptions = {
  readonly entry: string;
};

export type RuntimeGraphScan = {
  readonly files: Set<string>;
  readonly imports: Set<string>;
};

export async function scanRuntimeGraph(options: RuntimeGraphScanOptions): Promise<RuntimeGraphScan> {
  const files = new Set<string>();
  const imports = new Set<string>();
  const queue = [Path.resolve(options.entry)];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || files.has(current)) continue;
    files.add(current);

    const text = await Fs.readText(current);
    if (!text.ok) {
      const err = `EsmAssert.runtimeGraph: failed to read '${current}'.`;
      throw new Error(err);
    }
    const src = text.data ?? '';

    for (const spec of runtimeImportSpecifiers(src)) {
      imports.add(spec);
      if (!spec.startsWith('.')) continue;

      const resolved = await resolveLocalModule(current, spec);
      if (!resolved) {
        const err = `EsmAssert.runtimeGraph: failed to resolve local module '${spec}' from '${current}'.`;
        throw new Error(err);
      }

      queue.push(resolved);
    }
  }

  return { files, imports };
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
