import { describe, EsmAssert, expect, it, Path } from '../../-test.ts';
import { Cell } from '../mod.ts';

describe(`Cell`, () => {
  it('API', async () => {
    const m = await import('@sys/cell');
    expect(m.Cell).to.equal(Cell);
    expect(m.Cell.Schema).to.equal(Cell.Schema);
    expect(m.Cell.Runtime).to.equal(Cell.Runtime);
    expect(m.Cell.Runtime.verify).to.equal(Cell.Runtime.verify);
    expect(m.Cell.Runtime.start).to.equal(Cell.Runtime.start);
    expect(m.Cell.Runtime.wait).to.equal(Cell.Runtime.wait);
  });

  it('keeps FS-aware seams out of the public import graph', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');

    await EsmAssert.runtimeGraphBoundary({
      entry: Path.resolve(root, '../../mod.ts'),
      forbiddenImports: ['@sys/fs'],
      forbiddenPathIncludes: ['/src/m.cell/u.load.ts', '/src/m.cell/u.runtime/'],
    });
  });
});
