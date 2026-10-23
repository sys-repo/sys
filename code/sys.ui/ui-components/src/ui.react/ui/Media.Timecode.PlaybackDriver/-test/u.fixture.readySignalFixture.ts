import { type t } from '../common.ts';

type BeatIndex = t.TimecodeState.Playback.BeatIndex;

export function readySignalFixture() {
  const ix = (n: number): BeatIndex => n as BeatIndex;
  const ms = (n: number): t.Msecs => n as t.Msecs;

  const timeline: t.TimecodeState.Playback.Timeline = {
    beats: [
      {
        index: ix(0),
        vTime: ms(0),
        duration: ms(1000),
        pause: ms(0),
        segmentId: 'seg:1',
        media: { url: 'u:0' },
      },
    ],
    segments: [{ id: 'seg:1', beat: { from: ix(0), to: ix(1) } }],
    virtualDuration: ms(1000),
  };

  const state: t.TimecodeState.Playback.State = {
    phase: 'active',
    intent: 'pause',
    timeline,
    currentBeat: ix(0),
    vTime: ms(0),
    decks: { active: 'A', standby: 'B', status: { A: 'empty', B: 'empty' } },
    ready: { machine: true, runner: true, deck: { A: false, B: false } },
  };

  return { timeline, state };
}
