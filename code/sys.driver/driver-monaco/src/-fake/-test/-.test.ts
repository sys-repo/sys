import { describe, expect, it } from '../../-test.ts';
import { MonacoFake } from '../mod.ts';

describe('MonacoFake (test mocking)', () => {
  it('API', async () => {
    const m = await import('@sys/driver-monaco/dev');
    expect(m.MonacoFake).to.eql(MonacoFake);
  });
});
