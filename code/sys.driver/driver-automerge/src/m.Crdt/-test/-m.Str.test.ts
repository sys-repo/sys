import { describe, expect, it, Str } from '../../-test.ts';
import { CrdtStr } from '../mod.ts';

describe('Crdt.Str', () => {
  describe('Str.extractRefs', () => {
    it('extracts CRDT refs and skips YAML comments', () => {
      const text = Str.dedent(`

        ref: crdt:abc123
        ref: crdt: nomatch
        # ref: crdt:ignored
        more: crdt:Z9Y8x7
        inline: value # crdt:also-ignored
        list:
          - crdt:KLM456
          - foo: crdt:xyz123

      `);

      const refs = CrdtStr.extractRefs(text);
      expect(refs).to.eql(['crdt:abc123', 'crdt:Z9Y8x7', 'crdt:KLM456', 'crdt:xyz123']);
    });
  });
});
