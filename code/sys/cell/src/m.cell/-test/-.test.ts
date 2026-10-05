import { describe, EsmAssert, expect, it, Path } from '../../-test.ts';
import { Cell } from '../mod.ts';

describe(`Cell`, () => {
  it('API', async () => {
    const m = await import('@sys/cell');
    expect(m.Cell).to.equal(Cell);
    expect(m.Cell.Schema).to.equal(Cell.Schema);
    expect(m.Cell.Services).to.equal(Cell.Services);
    expect(m.Cell.Services.plan).to.equal(Cell.Services.plan);
    expect(m.Cell.Services.verify).to.equal(Cell.Services.verify);
    expect(m.Cell.Services.start).to.equal(Cell.Services.start);
    expect(m.Cell.Services.wait).to.equal(Cell.Services.wait);
    expect(m.Cell.Task).to.equal(Cell.Task);
    expect(m.Cell.Task.plan).to.equal(Cell.Task.plan);
    expect(m.Cell.Task.verify).to.equal(Cell.Task.verify);
    expect(m.Cell.Task.run).to.equal(Cell.Task.run);
    expect(m.Cell.start).to.equal(Cell.start);
    expect(m.Cell.task).to.equal(Cell.task);
  });

  it('freezes the public namespace graph', () => {
    const values = [
      Cell,
      Cell.Schema,
      Cell.Schema.Descriptor,
      Cell.Services,
      Cell.Task,
    ];
    for (const value of values) expect(Object.isFrozen(value)).to.eql(true);
  });

  it('keeps FS-aware seams out of the public import graph', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');

    await EsmAssert.runtimeGraphBoundary({
      entry: Path.resolve(root, '../../mod.ts'),
      forbiddenImports: ['@sys/fs'],
      forbiddenPathIncludes: [
        '/src/m.cell/u/load.ts',
        '/src/m.cell/u.services/',
        '/src/m.cell/u.task/',
      ],
    });
  });
});
