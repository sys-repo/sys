import { type t, Num } from './common.ts';

export function createPlaybackDriver(args: t.CreatePlaybackDriverArgs): t.PlaybackDriver {
  const { decks, resolveBeatMedia } = args;
  let disposed = false;

  const warn = (...a: unknown[]) => {
    if (args.log) console.warn(...a);
  };

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
        // Descriptive marker only; this driver does not maintain deck-routing state.
        return;
      }

      case 'cmd:deck:load': {
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

      for (const cmd of update.cmds) {
        exec(cmd, update.state);
      }
    },

    dispose(_reason) {
      disposed = true;
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

  return 0 as t.TimecodeState.Playback.BeatIndex;
}
