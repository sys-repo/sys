import { type t, PlaybackDriver, Timecode, TimecodeState } from './common.ts';

/**
 * Attach the playback driver effect.
 *
 * Manages controller-level integration with the TimecodePlaybackDriver:
 * - Driver lifecycle
 * - Video deck ownership
 * - Snapshot forwarding for UI consumption (aux/debug)
 */
export function attachPlaybackDriverEffect(controller: t.SlugPlaybackController): void {
  type State = t.SlugPlaybackState;
  type Snapshot = t.TimecodeState.Playback.Snapshot;
  type Timeline = t.TimecodeState.Playback.Timeline;
  type Bundle = t.TimecodePlaybackDriver.Wire.Bundle;
  type Decks = t.TimecodePlaybackDriver.VideoDecks;
  type RuntimePatch = Partial<Pick<t.SlugPlaybackRuntime, 'timeline' | 'snapshot'>>;

  const machine = TimecodeState.Playback;

  let gen = 0;
  const isStale = (g: number) => controller.disposed || g !== gen;

  let currDriver: t.TimecodePlaybackDriver.Driver | undefined;
  let lastObserved: { bundle?: Bundle; decks?: Decks } = {};
  let snapshot: Snapshot | undefined;

  // EffectController emits onChange synchronously for *any* controller.next,
  // including the patches emitted by this effect. If state cloning breaks
  // identity stability of {bundle,decks}, we can loop. Guard internal emissions.
  let isEmitting = false;
  const next = (patch: RuntimePatch) => {
    isEmitting = true;
    try {
      controller.next(patch);
    } finally {
      isEmitting = false;
    }
  };

  const teardown = (reason: 'slug-playback:teardown' | 'slug-playback:controller-dispose') => {
    currDriver?.dispose(reason);
    currDriver = undefined;
    snapshot = undefined;

    const patch: RuntimePatch = { timeline: undefined, snapshot: undefined };
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
  const buildTimeline = (spec: t.Timecode.Playback.Spec<unknown>): Timeline => {
    const resolved = Timecode.Composite.toVirtualTimeline(spec.composition);
    const expBeats: readonly t.Timecode.Experience.Beat<unknown>[] = spec.beats.map((b) => ({
      pause: b.pause,
      payload: b.payload,
      src: { ref: b.src.logicalPath, time: b.src.time },
    }));
    const experience = Timecode.Experience.toTimeline(resolved, expBeats);
    return TimecodeState.Playback.Util.buildTimeline(experience);
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
  const rebuild = (state: State) => {
    const { bundle, decks } = state;

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

    const timeline = buildTimeline(bundle.spec);
    const nextSnapshot = machine.init({ timeline });
    snapshot = nextSnapshot;

    /**
     * Playback driver wiring (media)
     */
    const resolveBeatMedia = PlaybackDriver.Util.resolveBeatMedia(bundle);
    currDriver = PlaybackDriver.create({ decks, resolveBeatMedia, dispatch, log: false });
    currDriver.apply(nextSnapshot);

    /**
     * Controller surface (UI/nav)
     */
    const timelineController = PlaybackDriver.Util.controller(dispatch);
    const runtimePatch: RuntimePatch = { snapshot: nextSnapshot, timeline: timelineController };
    next(runtimePatch);
  };

  const run = (state: State) => {
    if (isEmitting) return;
    rebuild(state);
  };

  const unsub = controller.onChange(run);
  controller.dispose$.subscribe(() => {
    teardown('slug-playback:controller-dispose');
    unsub();
  });

  run(controller.current());
}
