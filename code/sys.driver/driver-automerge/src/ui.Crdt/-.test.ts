import { describe, expect, it } from '../-test.ts';
import { Crdt } from './mod.ts';

import { Card } from '../ui/ui.Card/mod.ts';
import { DocumentId } from '../ui/ui.DocumentId/mod.ts';
import { useDoc } from '../ui/use/mod.ts';

describe('Input UI', () => {
  it('API', async () => {
    const m = await import('@sys/driver-automerge/web/ui');
    expect(m.Crdt).to.equal(Crdt);

    expect(Crdt.UI.Card).to.equal(Card);
    expect(Crdt.UI.DocumentId).to.equal(DocumentId);
    expect(Crdt.UI.useDoc).to.equal(useDoc);
  });
});
