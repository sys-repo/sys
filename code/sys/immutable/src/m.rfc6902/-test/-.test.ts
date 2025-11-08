import { describe, expect, it } from '../../-test.ts';
import { Immutable } from '../mod.ts';

import { Is } from '../common.ts';
import { Events } from '../m.Events.ts';
import { Patch } from '../m.Patch.ts';

describe('Immutable: RFC6902 (Patch Standard)', () => {
  it('API', async () => {
    expect(Immutable.Is).to.equal(Is);
    expect(Immutable.Patch).to.equal(Patch);
    expect(Immutable.Events).to.equal(Events);
  });
});
