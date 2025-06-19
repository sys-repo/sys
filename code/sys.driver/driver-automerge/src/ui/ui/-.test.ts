import { describe, expect, it } from '../../-test.ts';
import { DocumentId } from '../ui.DocumentId/mod.ts';
import { Crdt } from './mod.ts';

describe('Input UI', () => {
  it('API', () => {
    expect(Crdt.UI.DocumentId).to.equal(DocumentId);
  });
});
