import { describe, expect, it, type t } from '../-test.ts';
import { Immutable } from './mod.ts';

import { Events } from './m.Immutable/m.Events.ts';
import { Is } from './m.Immutable/m.Is.ts';
import { Patch } from './m.Immutable/m.Patch.ts';

describe('Immutable', () => {
  it('API', async () => {
    // NB: core implementation is exported under a (default) JSON patch standard RFC-6902.
    const m = await import('@sys/immutable/rfc6902');
    expect(m.Immutable).to.equal(Immutable);

    expect(Immutable.Is).to.equal(Is);
    expect(Immutable.Patch).to.equal(Patch);
    expect(Immutable.Events).to.equal(Events);
  });
});
