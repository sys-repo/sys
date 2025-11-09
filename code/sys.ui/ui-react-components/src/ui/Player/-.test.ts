import { describe, expect, it } from '../../-test.ts';
import { VideoElement } from '../Player.Video.Element/mod.ts';
import { Player } from './mod.ts';

describe('Player', () => {
  it('API', () => {
    expect(Player.Video.Element).to.equal(VideoElement);
  });
});
