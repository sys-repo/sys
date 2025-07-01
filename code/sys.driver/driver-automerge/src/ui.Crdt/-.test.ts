import { describe, expect, it } from '../-test.ts';
import { Crdt } from './mod.ts';

import { Card } from '../ui/ui.Card/mod.ts';
import { DocumentId } from '../ui/ui.DocumentId/mod.ts';
import { TextEditor } from '../ui/ui.TextEditor/mod.ts';
import { TextPanel } from '../ui/ui.TextPanel/mod.ts';

describe('Input UI', () => {
  it('API', () => {
    expect(Crdt.UI.Card).to.equal(Card);
    expect(Crdt.UI.DocumentId).to.equal(DocumentId);
    expect(Crdt.UI.TextEditor).to.equal(TextEditor);
    expect(Crdt.UI.TextPanel).to.equal(TextPanel);
  });
});
