import { type t, TimecodeState } from './common.ts';
import { projectRunnerState } from './u.project.runnerState.ts';

type DeckId = t.TimecodeState.Playback.DeckId;

/**
 * Create a runtime-backed playback runner.
 *
 * This adapter:
 *  - owns reducer state
 *  - feeds inputs into the reducer
 *  - publishes reducer events (observational)
 *  - executes reducer-issued commands against the runtime
 *  - exposes a stable observable read-model
 *
 * Law (single send flush):
 *   events → cmds → notify
 */
export function createRunner(args: t.PlaybackRunnerArgs): t.PlaybackRunner {
  const { runtime, initial, onEvent, onCmd } = args;
  const machine: t.TimecodeState.Playback.Lib = args.machine ?? TimecodeState.Playback;
  const project: t.PlaybackProjector = projectRunnerState;

  const subs = new Set<(s: t.PlaybackRunnerState) => void>();
  let state: t.TimecodeState.Playback.State = initial ?? machine.init().state;

  /**
   * Find the virtual vTime that corresponds to player time 0 for the segment
   * containing `beatIndex`, by walking backward until segment identity changes.
   *
   * Invariant:
   * Segment boundaries align to media identity.
   * At this layer, "media identity" is represented by `beat.segmentId`.
   */
  function segmentStartVTime(e: {
    readonly timeline: t.TimecodeState.Playback.Timeline;
    readonly beatIndex: number;
  }): t.Msecs {
    const beats = e.timeline.beats;
    const at = beats[e.beatIndex];
    if (!at) return 0;

    const atKey = at.segmentId;

    for (let i = e.beatIndex; i >= 0; i--) {
      const b = beats[i];
      if (!b) break;

      const bKey = b.segmentId;
      if (bKey !== atKey) return beats[i + 1]?.vTime ?? at.vTime;
    }

    return beats[0]?.vTime ?? at.vTime;
  }

  /**
   * Deck-local time base (msecs).
   *
   * When a deck is loaded with media, we record the virtual timeline vTime that
   * corresponds to player time 0 for that deck. Subsequent `cmd:deck:seek`
   * values are translated into deck-local time by subtracting this base.
   */
  const deckBaseVTime = new Map<DeckId, t.Msecs>();

  /**
   * Last loaded segment identity per deck.
   * Used to decide when to reset deckBaseVTime and mutate `props.src`.
   */
  const deckLastMediaKey = new Map<DeckId, string>();

  function segmentStartBeatIndex(e: {
    readonly timeline: t.TimecodeState.Playback.Timeline;
    readonly beatIndex: number;
  }): number {
    const beats = e.timeline.beats;
    const at = beats[e.beatIndex];
    if (!at) return 0;

    const atKey = at.segmentId;

    for (let i = e.beatIndex; i >= 0; i--) {
      const b = beats[i];
      if (!b) break;

      const bKey = b.segmentId;
      if (bKey !== atKey) return i + 1;
    }

    return 0;
  }

  function pauseBeforeBeatWithinSegment(e: {
    readonly timeline: t.TimecodeState.Playback.Timeline;
    readonly startIndex: number;
    readonly beatIndex: number;
  }): t.Msecs {
    const beats = e.timeline.beats;

    let sum: t.Msecs = 0;
    for (let i = e.startIndex; i < e.beatIndex; i++) {
      const b = beats[i];
      const pause = b?.pause ?? 0;
      sum += pause;
    }

    return sum;
  }

  /**
   * Execute reducer-issued commands against the runtime.
   */
  function exec(cmds: readonly t.TimecodeState.Playback.Cmd[]): void {
    for (const cmd of cmds) {
      onCmd?.(cmd);

      switch (cmd.kind) {
        case 'cmd:noop':
          break;

        case 'cmd:deck:play': {
          runtime.deck.play(cmd.deck);
          break;
        }

        case 'cmd:deck:pause': {
          runtime.deck.pause(cmd.deck);
          break;
        }

        case 'cmd:deck:seek': {
          const base = deckBaseVTime.get(cmd.deck) ?? 0;
          const localVirtual = Math.max(0, cmd.vTime - base);

          const timeline = state.timeline;
          const beatIndex = state.currentBeat;

          let pauseBefore = 0;
          let startIndex = 0;

          if (timeline && beatIndex !== undefined) {
            startIndex = segmentStartBeatIndex({ timeline, beatIndex });
            pauseBefore = pauseBeforeBeatWithinSegment({
              timeline,
              startIndex,
              beatIndex,
            });
          }

          const localMedia = Math.max(0, localVirtual - pauseBefore);
          runtime.deck.seek?.(cmd.deck, localMedia);
          break;
        }

        case 'cmd:deck:load': {
          /**
           * Orchestration cmd: load the media for a beat onto a specific deck.
           *
           * This runner stays mostly signal-agnostic, but if a hosting layer
           * provides `runtime.decks` (VideoPlayerSignals), we can perform a
           * minimal, real load by mutating `props.src`.
           */
          const decks = runtime.decks;
          const timeline = state.timeline;
          const beat = timeline?.beats[cmd.beat];
          const url = beat?.media?.url;

          /**
           * Media identity at this layer is the segment id.
           * Only mutate props.src / reset base when identity changes.
           */
          const nextKey = beat?.segmentId ?? '';
          const prevKey = deckLastMediaKey.get(cmd.deck);
          const hasMediaChanged = !!nextKey && prevKey !== nextKey;

          if (decks && url && hasMediaChanged) {
            const player = decks.get(cmd.deck);
            player.props.src.value = url;
          }

          /**
           * Record the virtual vTime corresponding to player time 0 for this deck.
           *
           * Only reset base when segment identity changes.
           */
          if (timeline && url && hasMediaChanged) {
            deckLastMediaKey.set(cmd.deck, nextKey);

            const base = segmentStartVTime({ timeline, beatIndex: cmd.beat });
            deckBaseVTime.set(cmd.deck, base);
          }
          break;
        }

        case 'cmd:swap-decks': {
          /**
           * Orchestration cmd: indicates the machine has swapped active/standby
           * ownership in state. In a "two stacked videos" UI, the host might
           * need to swap z-index / visibility.
           *
           * This runner intentionally performs no action here. The *meaning*
           * of a visual swap is host-specific (side-by-side debug vs stacked).
           */
          break;
        }

        case 'cmd:emit-ready':
          /**
           * Intentionally no-op here.
           * Ready is an orchestration signal; adapters may translate it into
           * runner-level signals (e.g. `runner:ready`) or bus events.
           */
          break;

        default:
          /** Exhaustiveness guard: */
          ((_: never) => _)(cmd);
      }
    }
  }

  /**
   * Publish reducer events (observational only).
   */
  function publish(events: readonly t.TimecodeState.Playback.Event[]): void {
    if (!onEvent) return;
    for (const e of events) onEvent(e);
  }

  /**
   * Publish the current observable read-model.
   */
  function notify(): void {
    const snapshot = project(state);
    subs.forEach((fn) => fn(snapshot));
  }

  /**
   * Apply a reducer update.
   *
   * Law: events → cmds → notify
   */
  function apply(update: t.TimecodeState.Playback.Update): void {
    state = update.state;
    publish(update.events);
    exec(update.cmds);
    notify();
  }

  return {
    get: () => project(state),
    send(input) {
      const update = machine.reduce(state, input);
      apply(update);
    },
    subscribe(fn) {
      subs.add(fn);
      fn(project(state));
      return () => subs.delete(fn);
    },
    dispose: () => subs.clear(),
  };
}
