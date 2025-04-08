import { type t, describe, expect, it } from '../../-test.ts';
import { AppSignals } from './mod.ts';

describe('AppSignals.Player', () => {
  const Player = AppSignals.Player;

  it('Player.key', () => {
    expect(Player.key('foo.bar', 3)).to.eql(`foo.bar:[3]`);
    expect(Player.key({ id: 'foo' }, 0)).to.eql(`foo:[0]`);
  });

  describe('AppSignals.Player.find', () => {
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
