import { type t, describe, expect, it } from '../../-test.ts';
import { AppSignals } from '../App.Signals/mod.ts';
import { AppContent, VIDEO } from './mod.ts';

describe('AppContent', () => {
  describe('.find: (factory)', () => {
    it('Entry', async () => {
      const res = await AppContent.find('Entry');
      expect(res?.id).to.eql('Entry');
    });

    it('Trailer', async () => {
      const res = await AppContent.find('Trailer');
      expect(res?.video?.src).to.eql(VIDEO.Trailer.src);
    });

    it('Overview', async () => {
      const res = await AppContent.find('Overview');
      expect(res?.video?.src).to.eql(VIDEO.Overview.src);
    });

    it('Programme', async () => {
      const res = await AppContent.find('Programme');
      expect(res?.id).to.eql('Programme');
    });

    it('Not Found', async () => {
      const res = await AppContent.find('Foobar' as any);
      expect(res).to.eql(undefined);
    });
  });

  describe('.Player.find', () => {
    type T = t.Content;
    const a: T = { id: 'foo' };
    const b: T = { id: 'foo.bar', video: { src: 'vimeo/1234' } };

    const test = (layer: t.StringId | T, index: number, expected: boolean) => {
      const app = AppSignals.create();
      app.stack.push(a);
      app.stack.push(b);
      expect(Object.keys(app.props.players).length).to.eql(1);

      const player = AppSignals.Player.find(app, layer, index);
      expect(typeof player?.play === 'function').to.eql(expected);
    };

    it('success', () => {
      test(b, 1, true);
      test(b.id, 1, true);
    });

    it('no-match', () => {
      test(a, 0, false);
      test(a, 1, false);
    });
  });
});
