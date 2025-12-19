import { type t, Signal, TimecodeState } from './common.ts';
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

  function sendInput(input: t.TimecodeState.Playback.Input): void {
    const update = machine.reduce(state, input);
    apply(update);
  }

  const endedTickPrev = new Map<DeckId, number>();
  const endedTickListeners = Signal.listeners();

  function wireDeckEndedTick(): void {
    const decks = runtime.decks;
    if (!decks) return;

    const ids: readonly DeckId[] = ['A', 'B'];

    for (const deck of ids) {
      const player = decks.get(deck);
      if (!player) continue;

      endedTickListeners.effect(() => {
        const tick = player.props.endedTick.value;
        const prev = endedTickPrev.get(deck);

        // Seed baseline (avoid firing on initial effect run).
        if (prev === undefined) {
          endedTickPrev.set(deck, tick);
          return;
        }

        if (tick !== prev) {
          endedTickPrev.set(deck, tick);
          sendInput({ kind: 'video:ended', deck });
        }
      });
    }
  }

  wireDeckEndedTick();

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
          const decks = runtime.decks;
          const timeline = state.timeline;
          const beat = timeline?.beats[cmd.beat];
          const url = beat?.media?.url;

          const nextKey = beat?.segmentId ?? '';
          const prevKey = deckLastMediaKey.get(cmd.deck);
          const hasMediaChanged = !!nextKey && prevKey !== nextKey;

          if (decks && url && hasMediaChanged) {
            const player = decks.get(cmd.deck);
            player.props.src.value = url;
          }

          if (timeline && url && hasMediaChanged) {
            deckLastMediaKey.set(cmd.deck, nextKey);

            const base = segmentStartVTime({ timeline, beatIndex: cmd.beat });
            deckBaseVTime.set(cmd.deck, base);
          }
          break;
        }

        case 'cmd:swap-decks': {
          break;
        }

        case 'cmd:emit-ready':
          break;

        default:
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
    send: (input) => sendInput(input),
    subscribe(fn) {
      subs.add(fn);
      fn(project(state));
      return () => subs.delete(fn);
    },
    dispose() {
      endedTickListeners.dispose();
      subs.clear();
    },
  };
}
