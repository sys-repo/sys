import { describe, expect, expectError, it } from '../../-test.ts';
import { Shard } from '../mod.ts';

describe('Shard.Sha256', () => {
  describe('normalizeHex', () => {
    it('accepts sha256- prefix (lowercase only)', () => {
      const input = `sha256-237BF73369464342ECDE735FC719E09B2E61D72F796101890CDCEE7EFCD1BB18`;
      const res = Shard.Sha256.normalizeHex(input.toLowerCase());
      expect(res).to.eql(`237bf73369464342ecde735fc719e09b2e61d72f796101890cdcee7efcd1bb18`);
    });

    it('accepts raw hex', () => {
      const input = `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`;
      const res = Shard.Sha256.normalizeHex(input);
      expect(res).to.eql(input);
    });

    it('rejects invalid input', () => {
      const BAD: string[] = [
        '',
        'sha256-',
        'sha256-xyz',
        'sha256-1234',
        'not-a-hash',
        `SHA256-${'a'.repeat(64)}`,
        `sha256-${'A'.repeat(64)}`,
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', // 63
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', // 65
        'g'.repeat(64),
      ];
      BAD.forEach((value) => expectError(() => Shard.Sha256.normalizeHex(value)));
    });
  });
});
