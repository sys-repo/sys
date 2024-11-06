import { describe, expect, it } from '../-test.ts';
import { Q, Release } from './mod.ts';

describe('Q (Node)', () => {
  it('API', () => {
    expect(Q.Release).to.equal(Release);
  });

  describe('Release', () => {
    it('.env', () => {
      const res = Release.env;
      expect(res.os).to.eql(Deno.build.os);
      expect(typeof res.arch === 'string').to.eql(true);
    });
  });
});
