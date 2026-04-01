import { Fs, Path } from '@sys/fs';
import { describe, expect, it } from '../../-test.ts';

describe('@sys/esm/core graph boundary', () => {
  it('stays outside deps and fs', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');
    const entry = Path.resolve(root, '../mod.ts');
    const seen = new Set<string>();
    const queue = [entry];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || seen.has(current)) continue;
      seen.add(current);

      const text = await Fs.readText(current);
      expect(text.ok).to.eql(true);
      const src = text.data ?? '';

      expect(src).to.not.include("@sys/fs");

      for (const spec of runtimeImportSpecifiers(src)) {
        expect(spec).to.not.eql('@sys/fs');
        if (!spec.startsWith('.')) continue;

        const resolved = resolveLocalModule(current, spec);
        expect(resolved).to.not.eql(undefined);
        if (!resolved) continue;
        expect(resolved).to.not.include('/src/m.deps/');
        queue.push(resolved);
      }
    }
  });
});

function resolveLocalModule(from: string, spec: string): string | undefined {
  const base = Path.resolve(Path.dirname(from), spec);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    Path.join(base, 'mod.ts'),
  ];

  return candidates.find((candidate) => {
    try {
      return Deno.statSync(candidate).isFile;
    } catch {
      return false;
    }
  });
}

function runtimeImportSpecifiers(src: string): string[] {
  return src
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !line.startsWith('import type '))
    .filter((line) => !line.startsWith('export type '))
    .flatMap((line) => Array.from(line.matchAll(/(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g)))
    .map((match) => match[1]);
}
