import { describe, expect, it } from '../../../-test.ts';
import { Data } from '../m.Data.ts';
import { HttpOrigin } from '../mod.ts';

import { cdn, media } from '../-spec/-samples.ts';

describe('HttpOrigin.Data', () => {
  it('API', () => {
    expect(HttpOrigin.Data).to.equal(Data);
  });

  describe('HttpOrigin.Data - sample models', () => {
    it('example: cdn tree (app + cdn)', () => {
      expect(cdn.tree.kind).to.equal('group');
    });

    it('example: media tree (api + assets + stream)', () => {
      expect(media.tree.kind).to.equal('group');
    });
  });
});
