import { describe, expect, it } from '../../-test.ts';
import { PlayerControls } from '../Player.Video.Controls/mod.ts';
import { VideoElement } from '../Player.Video.Element/mod.ts';
import { Player } from './mod.ts';

describe('Player', () => {
  it('API', () => {
    expect(Player.Video.UI).to.equal(VideoElement);
    expect(Player.Video.Controls.UI).to.equal(PlayerControls);
  });
});
