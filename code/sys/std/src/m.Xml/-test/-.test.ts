import { describe, expect, it } from '../../-test.ts';
import { Xml } from '../mod.ts';

describe('Xml', () => {
  describe('API', () => {
    it('exports the canonical @sys/std/xml facade', async () => {
      const m = await import('@sys/std/xml');
      expect(m.Xml).to.equal(Xml);
    });
  });
});
