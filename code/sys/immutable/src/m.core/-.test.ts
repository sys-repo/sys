import { describe, expect, it } from '../-test.ts';
import { Lens } from './m.Immutable.Lens/mod.ts';
import { asReadonly, Is, Symbols, toObject } from './m.Immutable/mod.ts';
import { PathRef } from './mod.ts';

describe('Immutable: core', () => {
  it('API', async () => {
    const m = await import('@sys/immutable/core');

    expect(m.Symbols).to.equal(Symbols);
    expect(m.Lens).to.equal(Lens);
    expect(m.Is).to.equal(Is);
    expect(m.toObject).to.equal(toObject);
    expect(m.asReadonly).to.equal(asReadonly);
    expect(m.PathRef).to.equal(PathRef);
  });
});
