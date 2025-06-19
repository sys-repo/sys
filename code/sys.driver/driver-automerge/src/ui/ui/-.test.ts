import { describe, expect, it } from '../../-test.ts';
import { Crdt } from './mod.ts';

import { Card } from '../ui.Card/mod.ts';
import { DocumentId } from '../ui.DocumentId/mod.ts';
import { TextEditor } from '../ui.TextEditor/mod.ts';

describe('Input UI', () => {
  it('API', () => {
    expect(Crdt.UI.Card).to.equal(Card);
    expect(Crdt.UI.DocumentId).to.equal(DocumentId);
    expect(Crdt.UI.TextEditor).to.equal(TextEditor);
  });
});
