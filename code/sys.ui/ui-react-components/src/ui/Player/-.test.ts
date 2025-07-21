import { describe, expect, it } from '../../-test.ts';
import { Thumbnails } from '../Player.Thumbnails/mod.ts';
import { Player } from './mod.ts';
import { VideoElement2 } from '../Player.Video.Element2/mod.ts';

describe('Player', () => {
  it('API', () => {
    expect(Player.Timestamp.Thumbnails.View).to.equal(Thumbnails);
    expect(Player.Video.Element2).to.equal(VideoElement2);
  });
});
