import { describe, expect, it } from '../../-test.ts';
import { YamlObjectView } from './mod.ts';

describe('Dev (UI Helper Components)', () => {
  it('API', async () => {
    const m = await import('@sys/driver-monaco/dev');
    expect(m.YamlObjectView).to.equal(YamlObjectView);
  });
});
