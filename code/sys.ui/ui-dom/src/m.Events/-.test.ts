import { describe, expect, it } from '../-test.ts';
import { Dom } from '../m.Dom/mod.ts';
import { UserHas } from './mod.ts';

describe('Dom.Events:', () => {
  it('API', async () => {
    const m = await import('@sys/ui-dom/events');
    expect(m.UserHas).to.equal(UserHas);
  });
});
