import { describe, expect, it } from '../../-test.ts';
import { Hash, sha1, sha256 } from '../mod.ts';

describe('Hash public exports', () => {
  it('named SHA exports are the namespace implementations', () => {
    expect(sha1).to.equal(Hash.sha1);
    expect(sha256).to.equal(Hash.sha256);
  });
});
