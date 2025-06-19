import { describe, expect, it } from '../../-test.ts';
import { DocumentIdInput } from '../ui.DocumentId/mod.ts';
import { Input } from './mod.ts';

describe('Input UI', () => {
  it('API', () => {
    expect(Input.DocumentId).to.equal(DocumentIdInput);
  });
});
