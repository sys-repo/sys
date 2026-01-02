import { type t, D, Num, Signal } from './common.ts';

/** Driver time authority: video time, ended suppression, and pause-window monotonic timer authority. */
type TimeSource = 'video' | 'suppressed-ended' | 'pause-timer';

type BeatIndex = t.TimecodeState.Playback.BeatIndex;
type State = t.TimecodeState.Playback.State;
type Timeline = t.TimecodeState.Playback.Timeline;
type PauseWindow = {
  readonly from: t.Msecs;
  readonly to: t.Msecs;
  readonly beat: BeatIndex;
};
type PauseTimer = {
  readonly deck: t.TimecodeState.Playback.DeckId;
  readonly from: t.Msecs;
  readonly to: t.Msecs;
  readonly wallStartMs: number;
  readonly intervalId: unknown;
};

/**
 * Imperative bridge between the playback state machine and the two video decks.
 *
 * Executes playback cmds against deck signals, and observes deck signals to dispatch
 * playback inputs (video:time / video:ended), including pause-window + ended suppression.
 */
export const createDriver: t.TimecodePlaybackDriverLib['driver'] = (args) => {
  const { decks, resolveBeatMedia } = args;

  const schedule = args.schedule ?? {
    now: () => Date.now(),
    setInterval: (fn: () => void, ms: number) => setInterval(fn, ms),
    clearInterval: (id: unknown) => clearInterval(id as never),
  };

  const disposers = new Set<() => void>();
  let disposed = false;
  let lastState: State | undefined;
  let timeSource: TimeSource = 'video';
  let pauseTimer: PauseTimer | undefined;

  /**
   * Runtime-edge idempotence:
   * Only mutate `src` when media identity changes, to avoid unnecessary reload churn.
   * (Slice may legitimately vary per beat, so it is always applied.)
   */
  const deckLastMediaKey = new Map<t.TimecodeState.Playback.DeckId, string>();

  const stopPauseTimer = () => {
    const curr = pauseTimer;
    if (!curr) return;
    schedule.clearInterval(curr.intervalId);
    pauseTimer = undefined;
  };

  const setTimeSource = (next: TimeSource) => void (timeSource = next);

  const rebaseTime = () => {
    stopPauseTimer();
    setTimeSource('video');
  };

  const suppressTimeAfterEnded = () => {
    stopPauseTimer();
    setTimeSource('suppressed-ended');
  };

  const startPauseTimer = (deck: t.TimecodeState.Playback.DeckId, pause: PauseWindow) => {
    stopPauseTimer();
    setTimeSource('pause-timer');

    const wallStartMs = Number(schedule.now());
    const fromN = Number(pause.from);
    const toN = Number(pause.to);

    const intervalId = schedule.setInterval(() => {
      if (disposed) return;

      const state = lastState;
      if (!state) return;

      // If higher layers switched intent, stop owning time.
      if (state.intent !== 'play') {
        stopPauseTimer();
        setTimeSource('video');
        return;
      }

      const elapsed = Number(schedule.now()) - wallStartMs;
      const next = (fromN + Math.max(0, elapsed)) as t.Msecs;
      const nextN = Number(next);

      if (nextN >= toN) {
        // Emit terminal boundary, then rebase to video authority.
        args.dispatch({ kind: 'video:time', deck, vTime: pause.to });
        stopPauseTimer();
        setTimeSource('video');

        // Resume media only if still active + intent is play.
        if (state.decks.active === deck && state.intent === 'play') {
          decks[deck].play();
        }

        return;
      }

      args.dispatch({ kind: 'video:time', deck, vTime: next });
    }, 50);

    pauseTimer = {
      deck,
      from: pause.from,
      to: pause.to,
      wallStartMs,
      intervalId,
    };
  };

  const getPauseWindow = (state: State): PauseWindow | undefined => {
    const timeline = state.timeline;
    if (!timeline) return;

    const beatIndex = state.currentBeat;
    if (beatIndex == null) return;

    const beat = timeline.beats[beatIndex];
    if (!beat) return;

    const pause = Number(beat.pause ?? 0);
    if (pause <= 0) return;

    // Authoritative pause span uses nextBeat.vTime delta (not beat.duration).
    const nextBeat = timeline.beats[Number(beatIndex) + 1];
    const beatStart = Number(beat.vTime);
    const nextStart = Number(nextBeat?.vTime ?? timeline.virtualDuration);

    const totalSpan = Math.max(0, nextStart - beatStart);
    const mediaSpan = Math.max(0, totalSpan - pause);

    const from = (beatStart + mediaSpan) as t.Msecs;
    const to = (Number(from) + pause) as t.Msecs;

    return {
      from,
      to,
      beat: beatIndex,
    };
  };

  const warn = (...a: unknown[]) => {
    if (args.log) console.warn(...a);
  };

  const observeDeck = (deck: t.TimecodeState.Playback.DeckId) => {
    // endedTick → video:ended (monotonic marker)
    // Seed baseline synchronously to avoid missing a bump before the first effect run.
    let lastEndedTick: number = Number(decks[deck].props.endedTick.value);

    disposers.add(
      Signal.effect(() => {
        const tick = Number(decks[deck].props.endedTick.value);

        if (tick === lastEndedTick) return;
        lastEndedTick = tick;

        const state = lastState;
        if (!state) return;
        if (state.decks.active !== deck) return;

        args.dispatch({ kind: 'video:ended', deck });
        suppressTimeAfterEnded();
      }),
    );

    // currentTime → video:time (runner emits vTime, not source time)
    let lastSecs: number | undefined;

    disposers.add(
      Signal.effect(() => {
        const raw = Number(decks[deck].props.currentTime.value);
        const secs = Number.isFinite(raw) ? (Math.max(0, raw) as t.Secs) : (0 as t.Secs);

        // First run: establish baseline, do not emit.
        if (lastSecs === undefined) {
          lastSecs = Number(secs);
          return;
        }

        if (Object.is(lastSecs, Number(secs))) return;
        lastSecs = Number(secs);

        const state = lastState;
        if (!state) return;
        if (state.decks.active !== deck) return;
        if (!state.timeline) return;
        if (timeSource !== 'video') return;

        const vTime = mapDeckSecondToVTime(state, secs);

        /**
         * Prevent media-driven time from skipping over a virtual pause.
         * When we detect the jump that crosses pauseFrom, clamp to pauseFrom, pause media,
         * and take time authority via a monotonic timer from pauseFrom→pauseTo.
         */
        if (state.intent === 'play' && state.vTime != null) {
          const pause = getPauseWindow(state);
          if (pause) {
            const prev = Number(state.vTime);
            const pauseFrom = Number(pause.from);

            if (prev < pauseFrom && Number(vTime) >= pauseFrom) {
              decks[deck].pause();
              args.dispatch({ kind: 'video:time', deck, vTime: pause.from });
              startPauseTimer(deck, pause);
              return;
            }
          }
        }

        args.dispatch({ kind: 'video:time', deck, vTime });
      }),
    );
  };

  observeDeck('A');
  observeDeck('B');

  const exec = (cmd: t.TimecodeState.Playback.Cmd, state: State) => {
    if (disposed) return;

    switch (cmd.kind) {
      case 'cmd:noop': {
        return;
      }

      case 'cmd:emit-ready': {
        // Descriptive marker only; this driver does not emit readiness signals.
        return;
      }

      case 'cmd:swap-decks': {
        // Rebase time authority after discrete deck routing changes.
        rebaseTime();
        return;
      }

      case 'cmd:deck:load': {
        rebaseTime();
        const signals = decks[cmd.deck];
        const media = resolveBeatMedia(cmd.beat);

        if (!media) {
          const isActive = state.decks.active === cmd.deck;
          const message = `${D.name}: missing media for beat=${cmd.beat} deck=${cmd.deck}`;
          if (isActive) {
            args.dispatch({ kind: 'runner:error', message });
          } else {
            warn(message);
          }

          return;
        }

        const beatSegId = state.timeline?.beats[cmd.beat]?.segmentId;
        const nextKey = String(beatSegId ?? media.src ?? '');
        const prevKey = deckLastMediaKey.get(cmd.deck);

        // Only update src when identity changes; slice may vary per beat and is always applied.
        if (prevKey !== nextKey) {
          signals.props.src.value = media.src;
          deckLastMediaKey.set(cmd.deck, nextKey);
        }
        signals.props.slice.value = media.slice;
        return;
      }

      case 'cmd:deck:play': {
        // Cmd-level play is a discrete rebase point: resume currentTime authority.
        rebaseTime();

        decks[cmd.deck].play();
        return;
      }

      case 'cmd:deck:pause': {
        // Stop any internal time ownership when explicitly paused.
        rebaseTime();
        decks[cmd.deck].pause();
        return;
      }

      case 'cmd:deck:seek': {
        rebaseTime();

        const signals = decks[cmd.deck];
        const second = mapVTimeToDeckSecond(state, cmd.vTime);

        // Preserve play/pause state (do not force play).
        signals.jumpTo(second); // play: undefined
        return;
      }
    }
  };

  const api: t.TimecodePlaybackDriver.Driver = {
    apply(update) {
      if (disposed) return;
      lastState = update.state;
      for (const cmd of update.cmds) exec(cmd, update.state);
    },

    dispose(_reason) {
      disposed = true;
      lastState = undefined;
      timeSource = 'video';
      stopPauseTimer();

      for (const d of disposers) d();
      disposers.clear();
    },
  };

  return api;
};

/**
 * Map GLOBAL virtual time (vTime) → deck-local media seconds (cropped domain).
 *
 * Key rule: pauses exist in vTime but NOT in media time.
 * So we subtract pauses implicitly by accumulating only beat.duration (not beat.pause).
 */
function mapVTimeToDeckSecond(state: State, vTime: t.Msecs): t.Secs {
  const timeline = state.timeline;
  if (!timeline) return 0 as t.Secs;
  if (timeline.beats.length === 0) return 0 as t.Secs;

  const beatIndex = beatIndexFromVTime(timeline, vTime);
  const beat = timeline.beats[beatIndex];
  if (!beat) return 0 as t.Secs;

  const segStart = segmentStartBeatIndex(timeline, beatIndex);

  let ms = 0;
  for (let i = segStart; i < beatIndex; i++) {
    const b = timeline.beats[i];
    if (!b) break;
    ms += Number(b.duration);
  }

  const offset = Number(vTime) - Number(beat.vTime);
  const within = Num.clamp(0, Number(beat.duration), offset);
  ms += within;

  return (ms / 1000) as t.Secs;
}

/**
 * Map deck-local media seconds → GLOBAL virtual time (vTime).
 *
 * Assumption (by design):
 * - Pauses exist in vTime but NOT in media time.
 * - During pause windows, the driver pauses media and owns vTime via a monotonic timer.
 */
function mapDeckSecondToVTime(state: State, second: t.Secs): t.Msecs {
  const timeline = state.timeline;
  if (!timeline) return 0;
  if (timeline.beats.length === 0) return 0;

  const beatIndex = state.currentBeat;
  if (beatIndex == null) return 0;

  const seg = segmentFromBeatIndex(timeline, beatIndex);
  const from = seg?.beat.from ?? 0;
  const to = seg?.beat.to ?? timeline.beats.length;

  let ms = Number(second) * 1000;

  for (let i = from; i < to; i++) {
    const beat = timeline.beats[i];
    if (!beat) break;

    const dur = Number(beat.duration);
    if (ms < dur) return Number(beat.vTime) + ms;
    ms -= dur;
  }

  const lastIx = Math.max(0, Number(to) - 1);
  const last = timeline.beats[lastIx];
  if (!last) return 0;

  const end = Number(last.vTime) + Number(last.duration) + Number(last.pause ?? 0);
  return Math.max(Number(last.vTime), end - 1);
}

function segmentFromBeatIndex(
  timeline: Timeline,
  beatIndex: BeatIndex,
): Timeline['segments'][number] | undefined {
  const beat = timeline.beats[beatIndex];
  const segId = beat?.segmentId;

  if (segId) {
    const byId = timeline.segments.find((s) => s.id === segId);
    if (byId) return byId;
  }

  return timeline.segments.find((s) => s.beat.from <= beatIndex && beatIndex < s.beat.to);
}

/**
 * Local copy of ui-state's beatIndexFromVTime logic (range includes pause).
 * Kept tiny and intentionally mirror-shaped to avoid inventing semantics.
 */
function beatIndexFromVTime(timeline: Timeline, vTime: t.Msecs): BeatIndex {
  const beats = timeline.beats;
  if (beats.length === 0) return 0 as BeatIndex;

  for (let i = beats.length - 1; i >= 0; i--) {
    const beat = beats[i];
    const from = Number(beat.vTime);
    const pause = Number(beat.pause ?? 0);
    const to = from + Number(beat.duration) + pause;
    const t = Number(vTime);
    if (t >= from && t < to) return beat.index;
  }

  if (Number(vTime) < Number(beats[0].vTime)) return beats[0].index;
  return beats[beats.length - 1].index;
}

/**
 * Segment start beat index.
 *
 * Primary: beat.segmentId → segments[].id
 * Fallback: segment beat-range match.
 */
function segmentStartBeatIndex(timeline: Timeline, beatIndex: BeatIndex): BeatIndex {
  const beat = timeline.beats[beatIndex];
  const segId = beat?.segmentId;
  const segments = timeline.segments;

  if (segId) {
    const byId = segments.findIndex((s) => s.id === segId);
    if (byId >= 0) return segments[byId]!.beat.from;
  }

  const byRange = segments.findIndex((s) => s.beat.from <= beatIndex && beatIndex < s.beat.to);
  if (byRange >= 0) return segments[byRange]!.beat.from;

  return 0;
}
