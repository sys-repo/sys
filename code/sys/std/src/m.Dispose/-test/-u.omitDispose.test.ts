import { describe, Dispose, expect, it, type t } from './common.ts';

describe('Dispose.omitDispose', () => {
  type T = t.Lifecycle & { count: number };

  it('lifecycle projection → observed state without disposal authority', () => {
    const lifecycle = Dispose.lifecycle();
    const source = Dispose.toLifecycle<T>(lifecycle, { count: 123 });
    expect('dispose' in source).to.eql(true);

    const projection = Dispose.omitDispose(source);
    expect(source).to.not.equal(projection);
    expect('dispose' in projection).to.eql(false);

    let count = 0;
    projection.dispose$.subscribe(() => count++);

    expect(projection.disposed).to.eql(false);
    lifecycle.dispose();

    expect(projection.disposed).to.eql(true);
    expect(count).to.eql(1);
  });
});
