import { describe, expect, it } from '../../-test.ts';
import { TextUpdate as PublicTextUpdate } from '@sys/text/update';
import { TextUpdate } from '../mod.ts';

describe(`TextUpdate`, () => {
  it('API', () => {
    expect(PublicTextUpdate).to.equal(TextUpdate);
  });
});
