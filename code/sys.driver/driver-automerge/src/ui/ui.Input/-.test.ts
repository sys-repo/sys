import { describe, expect, it } from '../../-test.ts';
import { DocumentIdInput } from '../ui.Input.DocumentId/mod.ts';
import { CrdtInput } from './mod.ts';

describe('Input UI', () => {
  it('API', () => {
    expect(CrdtInput.DocumentId).to.equal(DocumentIdInput);
  });
});
