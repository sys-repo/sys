import { type t, EffectController, Immutable, slug, Schedule } from '../common.ts';

/**
 * Test-only base URL used by SlugPlaybackDriver fixtures.
 * Not exported by runtime modules.
 */
export const baseUrl: t.StringUrl = 'http://test';

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
  type Patch = t.SlugPlaybackPatch;
  type Props = t.SlugPlaybackControllerProps;

  const id = `slug-playback-${slug()}`;
  const ref = Immutable.clonerRef<State>({});
  const props: Props = { baseUrl };
  return EffectController.create<State, Patch, Props>({ id, ref, props });
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
