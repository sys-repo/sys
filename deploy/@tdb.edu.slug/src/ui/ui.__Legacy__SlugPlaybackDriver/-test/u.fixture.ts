import { Effect, Immutable, Player, slug, type t } from '../common.ts';

/**
 * Test-only base URL used by SlugPlaybackDriver fixtures.
 * Not exported by runtime modules.
 */
export const baseUrl: t.StringUrl = 'http://test';

/** Create fresh bounded transport authority for a SlugPlaybackDriver test. */
export function testTransport(): t.SlugLoadTransport {
  return {
    policy: {
      maxBytes: 1024,
      timeout: 1000,
      maxRedirects: 0,
      progressInterval: 25,
      sourceOrigins: ['http://test'],
      credentialOrigins: [],
    },
  };
}

/**
 * Create test VideoDecks signals.
 */
export function createTestDecks(): t.VideoDecks {
  return Player.Video.Decks.create();
}

/**
 * Create a SlugPlaybackController wired with real EffectController
 * machinery, intended for unit tests only.
 *
 * - Uses Immutable.clonerRef for state
 * - No runtime side-effects
 * - Caller owns disposal
 */
export function createTestController() {
  type State = t.SlugPlaybackState;
  type Props = t.SlugPlaybackControllerProps;

  const id = `slug-playback-${slug()}`;
  const ref = Immutable.clonerRef<State>({});
  const props: Props = { baseUrl, transport: testTransport() };
  return Effect.Controller.create({ id, ref, props });
}

/**
 * Minimal playback bundle fixture.
 *
 * Satisfies the PlaybackDriver wire contract without providing
 * a real timeline, beats, or media resolver.
 *
 * Use only for tests that do not exercise playback semantics.
 */
export function makeTestPlaybackBundle(docid: t.StringId): t.TimecodePlaybackDriver.Wire.Bundle {
  const spec = {
    composition: undefined,
    beats: [],
  } as unknown as t.Timecode.Playback.Spec<unknown>;

  return {
    docid,
    spec,
    resolveAsset: () => undefined,
  };
}
