import { type t, Num, Signal } from './common.ts';

type TimeSource = 'video' | 'suppressed-ended';

export function createPlaybackDriver(args: t.CreatePlaybackDriverArgs): t.PlaybackDriver {
  const { decks, resolveBeatMedia } = args;

  let disposed = false;
  let lastState: t.TimecodeState.Playback.State | undefined;
  let timeSource: TimeSource = 'video';
  const disposers = new Set<() => void>();

  const rebaseTime = () => (timeSource = 'video');
  const suppressTimeAfterEnded = () => (timeSource = 'suppressed-ended');

  const warn = (...a: unknown[]) => {
    if (args.log) console.warn(...a);
  };

  const observeDeck = (deck: t.TimecodeState.Playback.DeckId) => {
    // endedTick → video:ended (monotonic marker)
    let lastEndedTick: number | undefined;

    disposers.add(
      Signal.effect(() => {
        const tick = decks[deck].props.endedTick.value;

        // First run: establish baseline, do not emit.
        if (lastEndedTick === undefined) {
          lastEndedTick = tick;
          return;
        }

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
        if (timeSource === 'suppressed-ended') return;

        const vTime = mapDeckSecondToVTime(state, secs);
        args.dispatch({ kind: 'video:time', deck, vTime });
      }),
    );
  };

  observeDeck('A');
  observeDeck('B');

  const exec = (cmd: t.TimecodeState.Playback.Cmd, state: t.TimecodeState.Playback.State) => {
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
        // Rebase time authority after swap (unlatch time suppression).
        rebaseTime();
        return;
      }

      case 'cmd:deck:load': {
        rebaseTime();
        const signals = decks[cmd.deck];
        const media = resolveBeatMedia(cmd.beat);

        if (!media) {
          const isActive = state.decks.active === cmd.deck;
          const message = `Media.Timecode.Driver: missing media for beat=${cmd.beat} deck=${cmd.deck}`;

          if (isActive) {
            args.dispatch({ kind: 'runner:error', message });
          } else {
            warn(message);
          }

          return;
        }

        // Apply media identity to the target deck (video element binding consumes these signals).
        signals.props.src.value = media.src;
        signals.props.slice.value = media.slice;
        return;
      }

      case 'cmd:deck:play': {
        decks[cmd.deck].play();
        return;
      }

      case 'cmd:deck:pause': {
        decks[cmd.deck].pause();
        return;
      }

      case 'cmd:deck:seek': {
        // 🌸🌸 ---------- ADDED: rebase-after-seek ----------
        rebaseTime();
        // 🌸 ---------- /ADDED ----------

        const signals = decks[cmd.deck];
        const second = mapVTimeToDeckSecond(state, cmd.vTime);

        // Preserve play/pause state (do not force play).
        signals.jumpTo(second); // play: undefined
        return;
      }
    }
  };

  const api: t.PlaybackDriver = {
    apply(update) {
      if (disposed) return;
      lastState = update.state;
      for (const cmd of update.cmds) exec(cmd, update.state);
    },

    dispose(_reason) {
      disposed = true;
      lastState = undefined;
      timeSource = 'video';

      for (const d of disposers) d();
      disposers.clear();
    },
  };

  return api;
}

/**
 * Map GLOBAL virtual time (vTime) → deck-local media seconds (cropped domain).
 *
 * Key rule: pauses exist in vTime but NOT in media time.
 * So we subtract pauses implicitly by accumulating only beat.duration (not beat.pause).
 */
function mapVTimeToDeckSecond(state: t.TimecodeState.Playback.State, vTime: t.Msecs): t.Secs {
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
 * - During pause windows, the driver will keep media paused, so deck seconds do not
 *   advance through virtual pauses. Therefore: seconds map only into beat.duration
 *   spans, while beat.pause is represented only in vTime space.
 */
function mapDeckSecondToVTime(state: t.TimecodeState.Playback.State, second: t.Secs): t.Msecs {
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
  timeline: t.TimecodeState.Playback.Timeline,
  beatIndex: t.TimecodeState.Playback.BeatIndex,
): t.TimecodeState.Playback.Timeline['segments'][number] | undefined {
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
function beatIndexFromVTime(
  timeline: t.TimecodeState.Playback.Timeline,
  vTime: t.Msecs,
): t.TimecodeState.Playback.BeatIndex {
  const beats = timeline.beats;
  if (beats.length === 0) return 0 as t.TimecodeState.Playback.BeatIndex;

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
function segmentStartBeatIndex(
  timeline: t.TimecodeState.Playback.Timeline,
  beatIndex: t.TimecodeState.Playback.BeatIndex,
): t.TimecodeState.Playback.BeatIndex {
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
