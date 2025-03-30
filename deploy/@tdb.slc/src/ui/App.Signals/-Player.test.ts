import { describe, expect, it } from '../../-test.ts';
import { AppSignals } from './mod.ts';

describe('AppSignals.Player', () => {
  const Player = AppSignals.Player;

  it('Player.key', () => {
    expect(Player.key('foo.bar', 3)).to.eql(`foo.bar:[3]`);
    expect(Player.key({ id: 'foo' }, 0)).to.eql(`foo:[0]`);
  });
});
