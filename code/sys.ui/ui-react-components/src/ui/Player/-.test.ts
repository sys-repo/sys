import { describe, expect, it } from '../../-test.ts';

import { Thumbnails } from '../Player.Thumbnails/mod.ts';
import { VideoElement } from '../Player.Video.Element/mod.ts';
import { Player } from './mod.ts';

describe('Player', () => {
  it('API', () => {
    expect(Player.Timestamp.Thumbnails.View).to.equal(Thumbnails);
    expect(Player.Video.Element).to.equal(VideoElement);
  });
});
