import { type t, PlaybackDriver, Timecode, TimecodeState } from '../common.ts';
import type { PlaybackEffectAdapter, SlugPlaybackRuntimeState } from './t.ts';

type Snapshot = t.TimecodeState.Playback.Snapshot;
type Timeline = t.TimecodeState.Playback.Timeline;
type Bundle = t.TimecodePlaybackDriver.Wire.Bundle;
type Decks = t.TimecodePlaybackDriver.VideoDecks;
type RuntimeKeys = 'timeline' | 'snapshot' | 'resolved' | 'experience';
type RuntimePatch = Partial<Pick<SlugPlaybackRuntimeState, RuntimeKeys>>;

/**
 * Attach the playback driver effect.
 *
 * Manages controller-level integration with the TimecodePlaybackDriver:
 * - Driver lifecycle
 * - Video deck ownership
 * - Snapshot forwarding for UI consumption (aux/debug)
 */
export function attachPlaybackDriverEffect(adapter: PlaybackEffectAdapter): void {
  const machine = TimecodeState.Playback;

  let gen = 0;
  const isStale = (g: number) => adapter.disposed || g !== gen;

  let currDriver: t.TimecodePlaybackDriver.Driver | undefined;
  let currDecks: Decks | undefined;
  let lastObserved: { bundle?: Bundle; decks?: Decks } = {};
  let snapshot: Snapshot | undefined;

  // EffectController emits onChange synchronously for *any* controller.next,
  // including the patches emitted by this effect. If state cloning breaks
  // identity stability of {bundle,decks}, we can loop. Guard internal emissions.
  let isEmitting = false;
  const next = (patch: RuntimePatch) => {
    isEmitting = true;
    try {
      adapter.next(patch);
    } finally {
      isEmitting = false;
    }
  };

  const resetDecks = (decks?: Decks) => {
    if (!decks) return;
    decks.A.props.src.value = undefined;
    decks.B.props.src.value = undefined;
  };

  const teardown = (reason: 'slug-playback:teardown' | 'slug-playback:controller-dispose') => {
    resetDecks(currDecks);

    currDriver?.dispose(reason);
    currDriver = undefined;
    currDecks = undefined;
    snapshot = undefined;

    const patch: RuntimePatch = {
      timeline: undefined,
      snapshot: undefined,
      resolved: undefined,
      experience: undefined,
    };
    next(patch);
  };

  const dispatch = (input: t.TimecodeState.Playback.Input) => {
    if (!snapshot) return;
    const nextSnapshot = machine.reduce(snapshot.state, input);
    snapshot = nextSnapshot;
    currDriver?.apply(nextSnapshot);

    const patch: RuntimePatch = { snapshot: nextSnapshot };
    next(patch);
  };

  /**
   * Timeline construction (pure)
   */
  const buildTimeline = (
    spec: t.Timecode.Playback.Spec<unknown>,
  ): {
    readonly timeline: Timeline;
    readonly resolved: t.Timecode.Composite.Resolved;
    readonly experience: t.Timecode.Experience.Timeline;
  } => {
    const resolved = Timecode.Composite.toVirtualTimeline(spec.composition);
    const expBeats: readonly t.Timecode.Experience.Beat<unknown>[] = spec.beats.map((b) => ({
      pause: b.pause,
      payload: b.payload,
      src: { ref: b.src.logicalPath, time: b.src.time },
    }));
    const experience = Timecode.Experience.toTimeline(resolved, expBeats);
    const timeline = TimecodeState.Playback.Util.buildTimeline(experience);
    return { timeline, resolved, experience };
  };

  /**
   * Effect responsibilities:
   * - owns timeline construction
   * - owns media driver lifecycle
   * - forwards snapshot + controller surface
   *
   * Non-responsibilities:
   * - slug selection / TreeHost resolution
   * - navigation / routing
   */
  const rebuild = (state?: SlugPlaybackRuntimeState) => {
    const { bundle, decks } = state ?? {};

    if (!bundle || !decks) {
      lastObserved = {};
      if (currDriver || snapshot) teardown('slug-playback:teardown');
      return;
    }

    if (bundle === lastObserved.bundle && decks === lastObserved.decks) return;
    lastObserved = { bundle, decks };

    const g = ++gen;
    teardown('slug-playback:teardown');
    if (isStale(g)) return;

    currDecks = decks;

    const { timeline, resolved, experience } = buildTimeline(bundle.spec);
    const nextSnapshot = machine.init({ timeline });
    snapshot = nextSnapshot;

    // Gen-gated dispatch: prevents late signals from old drivers stomping state.
    const dispatchG = (input: t.TimecodeState.Playback.Input) => {
      if (isStale(g)) return;
      dispatch(input);
    };

    /**
     * Playback driver wiring (media)
     */
    const resolveBeatMedia = PlaybackDriver.Util.resolveBeatMedia(bundle);
    currDriver = PlaybackDriver.create({
      decks,
      resolveBeatMedia,
      dispatch: dispatchG,
      log: false,
    });
    currDriver.apply(nextSnapshot);

    /**
     * Controller surface (UI/nav)
     */
    const timelineController = PlaybackDriver.Util.controller(dispatchG);
    const runtimePatch: RuntimePatch = {
      snapshot: nextSnapshot,
      timeline: timelineController,
      resolved,
      experience,
    };
    next(runtimePatch);

    // Deterministic “land at t=0” for every new bundle.
    const beat0 = TimecodeState.Playback.Util.beatIndexAtVTime(timeline, 0);
    timelineController.seekToBeat(beat0);
  };

  const run = (state?: SlugPlaybackRuntimeState) => {
    if (isEmitting) return;
    rebuild(state);
  };

  const unsub = adapter.onChange(run);
  adapter.dispose$.subscribe(() => {
    teardown('slug-playback:controller-dispose');
    unsub();
  });

  run(adapter.current());
}
