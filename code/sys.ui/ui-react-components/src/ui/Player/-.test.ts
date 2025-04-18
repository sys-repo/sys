import { describe, expect, it } from '../../-test.ts';
import { ConceptPlayer, VideoPlayer } from '../../mod.ts';
import { Thumbnails } from '../Player.Thumbnails/mod.ts';
import { Player } from './mod.ts';

describe('Player', () => {
  it('API', () => {
    expect(Player.Concept.View).to.equal(ConceptPlayer);
    expect(Player.Video.View).to.equal(VideoPlayer);
    expect(Player.Timestamp.Thumbnails.View).to.equal(Thumbnails);
  });
});
