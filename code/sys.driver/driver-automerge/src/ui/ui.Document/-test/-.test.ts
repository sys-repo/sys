import { describe, expect, it } from '../../../-test.ts';
import { DocumentId } from '../../ui.DocumentId/mod.ts';
import { Document } from '../mod.ts';

describe('UI: Document', () => {
  it('API', async () => {
    const m = await import('@sys/driver-automerge/web/ui');
    expect(Document.Id).to.equal(DocumentId);
    expect(m.Crdt.UI.Document).to.equal(Document);
  });
});
