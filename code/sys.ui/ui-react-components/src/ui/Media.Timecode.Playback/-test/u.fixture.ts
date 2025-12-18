import { type t } from '../common.ts';

export { TestVideoPlayerSignals } from '../../Player.Video.signals/-test/u.fixture.ts';

type RuntimeCall =
  | { readonly kind: 'play'; readonly deck: t.TimecodeState.Playback.DeckId }
  | { readonly kind: 'pause'; readonly deck: t.TimecodeState.Playback.DeckId }
  | {
      readonly kind: 'seek';
      readonly deck: t.TimecodeState.Playback.DeckId;
      readonly vTime: t.Msecs;
    };

/**
 * Deterministic playback timeline fixture.
 */
export function timeline(): t.TimecodeState.Playback.Timeline {
  const segId = 'seg:0';

  const beats: readonly t.TimecodeState.Playback.Beat[] = [
    { index: 0, vTime: 0, duration: 1000, segmentId: segId },
    { index: 1, vTime: 1000, duration: 1000, segmentId: segId },
    { index: 2, vTime: 2000, duration: 1000, segmentId: segId },
  ];

  const segments: readonly t.TimecodeState.Playback.Segment[] = [
    { id: segId, beat: { from: 0, to: 3 } },
  ];

  return { beats, segments, virtualDuration: 3000 } as const;
}

/**
 * Runtime stub capturing executed deck calls.
 */
export function createRuntime(): {
  readonly runtime: t.PlaybackRuntime;
  readonly calls: RuntimeCall[];
} {
  const calls: RuntimeCall[] = [];
  const runtime: t.PlaybackRuntime = {
    deck: {
      play: (deck) => calls.push({ kind: 'play', deck }),
      pause: (deck) => calls.push({ kind: 'pause', deck }),
      seek: (deck, vTime) => calls.push({ kind: 'seek', deck, vTime }),
    },
  };
  return { runtime, calls } as const;
}

/**
 * Project reducer cmds to runtime-visible effects.
 */
export function expectedCallsFromCmds(
  cmds: readonly t.TimecodeState.Playback.Cmd[],
): RuntimeCall[] {
  const res: RuntimeCall[] = [];

  for (const cmd of cmds) {
    switch (cmd.kind) {
      case 'cmd:deck:play':
        res.push({ kind: 'play', deck: cmd.deck });
        break;

      case 'cmd:deck:pause':
        res.push({ kind: 'pause', deck: cmd.deck });
        break;

      case 'cmd:deck:seek':
        res.push({ kind: 'seek', deck: cmd.deck, vTime: cmd.vTime });
        break;

      // Ignored at this adapter layer.
      case 'cmd:noop':
      case 'cmd:emit-ready':
      case 'cmd:deck:load':
      case 'cmd:swap-decks':
        break;

      default:
        ((_: never) => _)(cmd);
    }
  }

  return res;
}
