import { describe, expect, it } from '../../-test.ts';
import { Content } from '../mod.ts';
import { VIDEO } from '../VIDEO.ts';

describe('AppContent', () => {
  describe('.find: (factory)', () => {
    it('Entry', async () => {
      const res = await Content.factory('Entry');
      expect(res?.id).to.eql('Entry');
    });

    it('Trailer', async () => {
      const res = await Content.factory('Trailer');
      expect(res?.video?.src).to.eql(VIDEO.Trailer.src);
    });

    it('Overview', async () => {
      const res = await Content.factory('Overview');
      expect(res?.video?.src).to.eql(VIDEO.Overview.src);
    });

    it('Programme', async () => {
      const res = await Content.factory('Programme');
      expect(res?.id).to.eql('Programme');
    });

    it('Not Found', async () => {
      const res = await Content.factory('Foobar' as any);
      expect(res).to.eql(undefined);
    });
  });
});
