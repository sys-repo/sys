import { type t } from '../common.ts';

type BeatIndex = t.TimecodeState.Playback.BeatIndex;
type Timeline = t.TimecodeState.Playback.Timeline;

export type PauseClampFixture = {
  readonly timeline: Timeline;

  /** Derived by the SAME rule as useClock: nextBeat.vTime delta (not duration). */
  readonly pauseFrom: t.Msecs;
  readonly pauseTo: t.Msecs;

  /** Convenience: seconds that place media exactly at pauseFrom when offset=0. */
  readonly mediaSecsAtPauseFrom: t.Secs;
};

/**
 * Fixture for clamp logic: durations intentionally contradict vTime deltas.
 * Use only where mapping by duration is NOT part of the assertion.
 */
export function pauseClampWithBadDurationFixture(): PauseClampFixture {
  const ix = (n: number): BeatIndex => n as BeatIndex;
  const ms = (n: number): t.Msecs => n as t.Msecs;

  const segId = 'seg:pause';

  /**
   * We want:
   *   beat0.vTime = 0
   *   nextBeat.vTime = 14_000  → totalSpan = 14_000
   *   beat0.pause = 2_000      → mediaSpan = 12_000
   *   pauseFrom = 12_000, pauseTo = 14_000
   *
   * And we intentionally make beat0.duration WRONG so any duration-based logic breaks.
   */
  const timeline: Timeline = {
    beats: [
      {
        index: ix(0),
        vTime: ms(0),
        duration: ms(1_000), // intentionally inconsistent (NOT authoritative)
        pause: ms(2_000),
        segmentId: segId,
        media: { url: 'u:0' },
      },
      {
        index: ix(1),
        vTime: ms(14_000), // authoritative for pause window end
        duration: ms(4_000),
        pause: ms(0),
        segmentId: segId,
        media: { url: 'u:0' },
      },
    ],
    segments: [{ id: segId, beat: { from: ix(0), to: ix(2) } }],
    virtualDuration: ms(20_000),
  };

  const beatStart = ms(0);
  const nextStart = ms(14_000);
  const pause = ms(2_000);

  const totalSpan = ms(Math.max(0, Number(nextStart) - Number(beatStart)));
  const mediaSpan = ms(Math.max(0, Number(totalSpan) - Number(pause)));

  const pauseFrom = ms(Number(beatStart) + Number(mediaSpan));
  const pauseTo = ms(Number(pauseFrom) + Number(pause));
  const mediaSecsAtPauseFrom = (Number(pauseFrom) / 1000) as t.Secs;

  return {
    timeline,
    pauseFrom,
    pauseTo,
    mediaSecsAtPauseFrom,
  } as const;
}

/**
 * Fixture for closed-loop pause-window tests: durations are consistent with vTime deltas
 * so media seconds map cleanly into the pause window.
 */
export function pauseWindowLoopFixture(): PauseClampFixture {
  const ix = (n: number): BeatIndex => n as BeatIndex;
  const ms = (n: number): t.Msecs => n as t.Msecs;

  const segId = 'seg:pause';

  /**
   * Consistent durations so media seconds map cleanly to pauseFrom.
   *
   * beat0.vTime = 0
   * nextBeat.vTime = 14_000
   * beat0.duration = 12_000
   * beat0.pause = 2_000
   * pauseFrom = 12_000, pauseTo = 14_000
   */
  const timeline: Timeline = {
    beats: [
      {
        index: ix(0),
        vTime: ms(0),
        duration: ms(12_000),
        pause: ms(2_000),
        segmentId: segId,
        media: { url: 'u:0' },
      },
      {
        index: ix(1),
        vTime: ms(14_000),
        duration: ms(4_000),
        pause: ms(0),
        segmentId: segId,
        media: { url: 'u:0' },
      },
    ],
    segments: [{ id: segId, beat: { from: ix(0), to: ix(2) } }],
    virtualDuration: ms(20_000),
  };

  const beatStart = ms(0);
  const nextStart = ms(14_000);
  const pause = ms(2_000);

  const totalSpan = ms(Math.max(0, Number(nextStart) - Number(beatStart)));
  const mediaSpan = ms(Math.max(0, Number(totalSpan) - Number(pause)));

  const pauseFrom = ms(Number(beatStart) + Number(mediaSpan));
  const pauseTo = ms(Number(pauseFrom) + Number(pause));
  const mediaSecsAtPauseFrom = (Number(pauseFrom) / 1000) as t.Secs;

  return {
    timeline,
    pauseFrom,
    pauseTo,
    mediaSecsAtPauseFrom,
  } as const;
}
