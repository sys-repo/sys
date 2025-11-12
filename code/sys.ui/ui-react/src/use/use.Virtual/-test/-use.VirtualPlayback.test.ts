import {
  type t,
  act,
  describe,
  DomMock,
  expect,
  it,
  renderHook,
  Rx,
  Timecode,
} from '../../../-test.ts';
import { useVirtualPlayback } from '../mod.ts';

const seg = (
  vf: number,
  vt: number,
  of: number,
  src: t.StringRef = 'test:0' as t.StringRef,
): t.TimecodeResolvedSegment => ({
  src,
  virtual: { from: vf as t.Msecs, to: vt as t.Msecs },
  original: { from: of as t.Msecs, to: (of + (vt - vf)) as t.Msecs },
});

const resolved = (
  total: number,
  segments: readonly t.TimecodeResolvedSegment[],
): t.TimecodeCompositionResolved => ({
  total: total as t.Msecs,
  segments,
});

describe('useVirtualPlayback', () => {
  DomMock.polyfill();

  it('initializes and responds to play/pause/seek deterministically', async () => {
    const life = Rx.lifecycle();
    const tl = resolved(2_000, [seg(0, 2_000, 10_000)]);
    const { result, unmount } = renderHook(() =>
      useVirtualPlayback(tl, { autoPlay: false, startAt: 0, life, driver: 'off' }),
    );

    expect(result.current.playing).to.eql(false);
    expect(result.current.vtime).to.eql(0);

    act(() => result.current.play());
    expect(result.current.playing).to.eql(true);

    act(() => result.current.seek(500 as any));
    expect(result.current.vtime).to.eql(500);
    expect(result.current.index).to.eql(0);

    act(() => result.current.pause());
    expect(result.current.playing).to.eql(false);

    act(() => life.dispose());
    unmount();
    await Promise.resolve(); // flush any microtasks
  });

  it('advances via manual clock control (integration sanity)', async () => {
    const life = Rx.lifecycle();
    const tl = resolved(1_000, [seg(0, 1_000, 0)]);
    let clock: t.VirtualClock | null = null;

    const { result, unmount } = renderHook(() =>
      useVirtualPlayback(tl, {
        startAt: 0,
        autoPlay: true,
        life,
        driver: 'off', // no RAF loop in tests
        debug: { onClock: (c) => (clock = c) }, // capture the underlying clock
      }),
    );

    expect(clock).to.exist;

    // Advance the core clock, then publish into the hook via seek:
    act(() => {
      const next = clock!.advance(250 as t.Msecs);
      result.current.seek(Timecode.VTime.toMsecs(next.vtime) as any);
    });

    expect(result.current.vtime).to.eql(250);

    act(() => life.dispose());
    unmount();
    await Promise.resolve();
  });
});
