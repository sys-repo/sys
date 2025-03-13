import { type t, describe, it, expect } from '../../-test.ts';
import { Player } from './mod.ts';
import { ConceptPlayer, VideoPlayer } from '../../mod.ts';
import { Thumbnails } from '../Player.Thumbnails/mod.ts';

describe('Player', () => {
  it('API', () => {
    expect(Player.Concept).to.equal(ConceptPlayer);
    expect(Player.Video).to.equal(VideoPlayer);
    expect(Player.Timestamp.Thumbnails).to.equal(Thumbnails);
  });
});
