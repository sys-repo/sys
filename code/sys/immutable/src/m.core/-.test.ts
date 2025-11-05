import { describe, expect, it, type t } from '../-test.ts';
import { Immutable } from './mod.ts';

import { Events } from './m.Immutable/m.Events.ts';
import { Is } from './m.Immutable/m.Is.ts';
import { Patch } from './m.Immutable/m.Patch.ts';

describe('Immutable', () => {
  it('API', async () => {
    const m = await import('@sys/immutable/core');
    expect(m.Immutable).to.equal(Immutable);

    expect(Immutable.Is).to.equal(Is);
    expect(Immutable.Patch).to.equal(Patch);
    expect(Immutable.Events).to.equal(Events);
  });
});
