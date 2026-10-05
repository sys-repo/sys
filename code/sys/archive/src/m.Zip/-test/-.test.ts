import { describe, expect, it, Obj } from '../../-test.ts';
import { Zip } from '../mod.ts';

describe('@sys/archive/zip', () => {
  it('resolves the public ZIP entry', async () => {
    const m = await import('@sys/archive/zip');
    expect(Obj.keys(m)).eql(['Zip']);
    expect(m.Zip).equal(Zip);
  });
});
