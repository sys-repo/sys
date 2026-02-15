import { describe, expect, it } from '../../-test.ts';

import type { t } from '../common.ts';
import { SlugUrl } from '../mod.ts';

describe('SlugUrl.Util', () => {
  describe('cleanDocid', () => {
    it('removes crdt prefix and trims input', () => {
      expect(SlugUrl.Util.cleanDocid('  crdt:foo  ' as t.StringId)).to.eql('foo');
    });

    it('preserves non-prefixed docids', () => {
      expect(SlugUrl.Util.cleanDocid('plain-docid' as t.StringId)).to.eql('plain-docid');
    });
  });
});
