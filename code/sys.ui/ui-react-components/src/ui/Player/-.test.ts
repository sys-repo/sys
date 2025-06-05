import { describe, expect, it } from '../../-test.ts';
import { VideoPlayer } from '../Player.Video.Vidstack/mod.ts';
import { Thumbnails } from '../Player.Thumbnails/mod.ts';
import { Player } from './mod.ts';

describe('Player', () => {
  it('API', () => {
    expect(Player.Video.View).to.equal(VideoPlayer);
    expect(Player.Timestamp.Thumbnails.View).to.equal(Thumbnails);
  });
});
