import { describe, DomMock, expect, it, renderHook } from '../../../-test.ts';
import { type t } from '../common.ts';
import { PlaybackDriver } from '../mod.ts';

describe('Media.Timecode.Driver: usePlaybackTimeline', () => {
  DomMock.polyfill();

  const ms = (n: number): t.Msecs => n;
  const makeEmptySpec = (): t.Timecode.Playback.Spec<unknown> => ({ composition: [], beats: [] });
  const makeTwoSegmentSpec = (): t.Timecode.Playback.Spec<unknown> => {
    const srcA: t.StringRef = 'src:A';
    const srcB: t.StringRef = 'src:B';
    const composition: t.Timecode.Composite.Spec = [
      { src: srcA, duration: ms(10_000) },
      { src: srcB, duration: ms(5_000) },
    ];
    const beats: readonly t.Timecode.Experience.Beat<unknown>[] = [
      { src: { ref: srcA, time: ms(0) }, payload: {} },
      { src: { ref: srcA, time: ms(2_000) }, payload: {}, pause: ms(1_000) },
      { src: { ref: srcB, time: ms(0) }, payload: {} },
    ];
    return { composition, beats };
  };

  it('returns empty projection when spec is <undefined>', () => {
    const { result, unmount } = renderHook(() =>
      PlaybackDriver.usePlaybackTimeline({ spec: undefined }),
    );

    expect(result.current.resolved).to.eql(undefined);
    expect(result.current.experience).to.eql(undefined);
    expect(result.current.playback).to.eql(undefined);

    unmount();
  });

  it('projects spec → { resolved, experience, playback } (empty spec)', () => {
    const spec = makeEmptySpec();
    const { result, unmount } = renderHook(() => PlaybackDriver.usePlaybackTimeline({ spec }));
    const { resolved, experience, playback } = result.current;

    expect(resolved).to.not.eql(undefined);
    expect(experience).to.not.eql(undefined);
    expect(playback).to.not.eql(undefined);

    expect(playback!.virtualDuration).to.eql(resolved!.total);
    expect(experience!.duration).to.eql(resolved!.total);

    expect(experience!.beats.length).to.eql(0);
    expect(playback!.beats.length).to.eql(0);
    expect(playback!.segments.length).to.eql(0);

    unmount();
  });

  it('projects beats onto resolved segments (2 segments, 3 beats)', () => {
    const spec = makeTwoSegmentSpec();
    const { result, unmount } = renderHook(() => PlaybackDriver.usePlaybackTimeline({ spec }));
    const { resolved, experience, playback } = result.current;

    expect(resolved).to.not.eql(undefined);
    expect(experience).to.not.eql(undefined);
    expect(playback).to.not.eql(undefined);

    // Resolved composition is deterministic from durations.
    expect(resolved!.segments.length).to.eql(2);
    expect(resolved!.total).to.eql(ms(15_000));

    // Boundary invariants:
    expect(playback!.virtualDuration).to.eql(resolved!.total);

    // Experience duration includes semantic pauses; must be >= pure virtual total.
    expect(experience!.duration >= resolved!.total).to.eql(true);

    // Beats mapped and preserved.
    expect(experience!.beats.length).to.eql(3);
    expect(playback!.beats.length).to.eql(3);

    // Playback beats mirror experience vTime and pause.
    expect(playback!.beats[0]!.vTime).to.eql(experience!.beats[0]!.vTime);
    expect(playback!.beats[1]!.vTime).to.eql(experience!.beats[1]!.vTime);
    expect(playback!.beats[2]!.vTime).to.eql(experience!.beats[2]!.vTime);

    expect(playback!.beats[1]!.pause).to.eql(ms(1_000));

    // Monotonic vTime (core projection invariant).
    expect(experience!.beats[0]!.vTime <= experience!.beats[1]!.vTime).to.eql(true);
    expect(experience!.beats[1]!.vTime <= experience!.beats[2]!.vTime).to.eql(true);

    // Segment identity should flip when we move to srcB (second piece).
    expect(playback!.beats[0]!.segmentId).to.eql('seg:0');
    expect(playback!.beats[1]!.segmentId).to.eql('seg:0');
    expect(playback!.beats[2]!.segmentId).to.eql('seg:1');

    // Segment ranges should reflect the grouping (beat[0..2) in seg0, beat[2..3) in seg1).
    expect(playback!.segments.length).to.eql(2);
    expect(playback!.segments[0]!.id).to.eql('seg:0');
    expect(playback!.segments[0]!.beat.from).to.eql(0);
    expect(playback!.segments[0]!.beat.to).to.eql(2);

    expect(playback!.segments[1]!.id).to.eql('seg:1');
    expect(playback!.segments[1]!.beat.from).to.eql(2);
    expect(playback!.segments[1]!.beat.to).to.eql(3);

    unmount();
  });
});
