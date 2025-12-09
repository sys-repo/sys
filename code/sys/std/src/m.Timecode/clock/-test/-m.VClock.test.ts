import { type t, describe, expect, it } from '../../../-test.ts';
import { VClock, VTime } from '../mod.ts';

describe('VClock - Virtual Clock', () => {
  it('empty timeline → stable state', () => {
    const clock = VClock.make(undefined, {});
    const s = clock.get();
    expect(s.vtime).to.eql(0);
    expect(s.index).to.eql(-1);
    expect(s.seg).to.eql(undefined);
    expect(s.playing).to.eql(true);

    // advance no-ops when total <= 0
    const s2 = clock.advance(16);
    expect(s2).to.eql(s);
  });

  it('initialization clamps startAt within [0,total)', () => {
    const tl = resolved(1_000, [seg(0, 1_000, 5_000)]);
    const a = VClock.make(tl, { startAt: -100 });
    const b = VClock.make(tl, { startAt: 10_000 });
    const c = VClock.make(tl, { startAt: 999 });

    expect(VTime.toMsecs(a.get().vtime)).to.eql(0);
    expect(VTime.toMsecs(b.get().vtime)).to.eql(999);
    expect(VTime.toMsecs(c.get().vtime)).to.eql(999);
  });

  it('.get() is idempotent', () => {
    const tl = resolved(1_000, [seg(0, 1_000, 5_000)]);
    const c = VClock.make(tl, { startAt: -100 });
    expect(c.get()).to.eql(c.get()); //       same data every call
    expect(c.get()).to.not.equal(c.get()); // new object instance each call
  });

  it('seek clamps and updates mapping (single segment)', () => {
    const tl = resolved(2_000, [seg(0, 2_000, 10_000)]);
    const clock = VClock.make(tl, {});
    const s1 = clock.seek(VTime.fromMsecs(1_234));
    expect(s1.index).to.eql(0);
    expect(s1.seg).to.eql(tl.segments[0]);
    expect(VTime.toMsecs(s1.vtime)).to.eql(1_234);

    const s2 = clock.seek(VTime.fromMsecs(5_000));
    expect(VTime.toMsecs(s2.vtime)).to.eql(1_999); // exclusive end clamps to total-1
    expect(s2.index).to.eql(0);
  });

  it('advance applies speed and respects playing flag', () => {
    const tl = resolved(2_000, [seg(0, 2_000, 0)]);
    const clock = VClock.make(tl, { startAt: 0, speed: 1 });
    const s0 = clock.get();
    expect(VTime.toMsecs(s0.vtime)).to.eql(0);

    const s1 = clock.advance(100);
    expect(VTime.toMsecs(s1.vtime)).to.eql(100);

    const s2 = clock.pause();
    expect(s2.playing).to.eql(false);

    const s3 = clock.advance(500); // paused → no movement
    expect(VTime.toMsecs(s3.vtime)).to.eql(100);

    const s4 = clock.play();
    expect(s4.playing).to.eql(true);

    const s5 = clock.advance(200);
    expect(VTime.toMsecs(s5.vtime)).to.eql(300);
  });

  it('loop: wraps using modulo when enabled (small step)', () => {
    const tl = resolved(300, [seg(0, 300, 0)]);
    const clock = VClock.make(tl, { loop: true, startAt: 250, speed: 1 });

    // Advance past end: (250 + 100) % 300 = 50
    const s1 = clock.advance(100);
    expect(VTime.toMsecs(s1.vtime)).to.eql(50);
    expect(s1.playing).to.eql(true);
  });

  it('loop: modulo wrap on large overshoot (new behavior)', () => {
    const total = 1000 as t.Msecs;
    const tl = resolved(total, [seg(0, total, 0)]);
    const clock = VClock.make(tl, { loop: true, startAt: 900, speed: 1 });

    // Large delta overshoots several lengths; expect modulo wrap
    const delta = 1_350; // 900 + 1350 = 2250; 2250 % 1000 = 250
    const s = clock.advance(delta);
    expect(VTime.toMsecs(s.vtime)).to.eql(250);
    expect(s.playing).to.eql(true);
  });

  it('no loop: stops at end and sets playing=false', () => {
    const tl = resolved(300, [seg(0, 300, 0)]);
    const clock = VClock.make(tl, { loop: false, startAt: 250, speed: 1 });

    const s1 = clock.advance(100);
    // Clamped at total-1 and paused
    expect(VTime.toMsecs(s1.vtime)).to.eql(299);
    expect(s1.playing).to.eql(false);
  });

  it('mapToSource returns null when timeline empty', () => {
    const clock = VClock.make(undefined, {});
    expect(clock.mapToSource(VTime.fromMsecs(0))).to.eql(null);
  });

  it('mapToSource maps vtime → (index, seg, srcTime, offset)', () => {
    // two segments back-to-back in the virtual timeline
    const a = seg(0, 1_000, 5_000); // maps virtual [0,1000) → original [5000,6000)
    const b = seg(1_000, 2_500, 20_000); // maps virtual [1000,2500) → original [20000,21500)
    const tl = resolved(2_500, [a, b]);

    const clock = VClock.make(tl, {});
    const m1 = clock.mapToSource(VTime.fromMsecs(250));
    expect(m1).to.not.eql(null)!;
    expect(m1!.index).to.eql(0);
    expect(m1!.seg).to.eql(a);
    expect(m1!.offset).to.eql(250);
    expect(m1!.srcTime).to.eql(5_250);

    const m2 = clock.mapToSource(VTime.fromMsecs(1_234));
    expect(m2).to.not.eql(null)!;
    expect(m2!.index).to.eql(1);
    expect(m2!.seg).to.eql(b);
    expect(m2!.offset).to.eql(234);
    expect(m2!.srcTime).to.eql(20_234);
  });

  it('boundary mapping: v == seg.virtual.to maps to next segment', () => {
    const a = seg(0, 1_000, 5_000);
    const b = seg(1_000, 2_000, 10_000);
    const tl = resolved(2_000, [a, b]);
    const clock = VClock.make(tl, {});

    // exactly at boundary → should map to segment b (index 1)
    const m = clock.mapToSource(VTime.fromMsecs(1_000));
    expect(m).to.not.eql(null)!;
    expect(m!.index).to.eql(1);
    expect(m!.seg).to.eql(b);
    expect(m!.offset).to.eql(0);
    expect(m!.srcTime).to.eql(10_000);
  });

  it('boundary mapping: v == total returns null (exclusive end)', () => {
    const a = seg(0, 1_000, 0);
    const tl = resolved(1_000, [a]);
    const clock = VClock.make(tl, {});
    const m = clock.mapToSource(VTime.fromMsecs(1_000));
    expect(m).to.eql(null);
  });

  it('empty segments but total > 0 → stable state; mapToSource null', () => {
    const tl = resolved(1_000, [] as unknown as readonly t.TimecodeResolvedSegment[]);
    const clock = VClock.make(tl, { startAt: 500, loop: true, speed: 1 });
    const s = clock.get();
    expect(VTime.toMsecs(s.vtime)).to.eql(500);
    expect(s.index).to.eql(-1);
    expect(s.seg).to.eql(undefined);
    // mapping returns null
    expect(clock.mapToSource(VTime.fromMsecs(250))).to.eql(null);
  });

  it('setSpeed(0) vs pause(): both yield no movement on advance', () => {
    const tl = resolved(2_000, [seg(0, 2_000, 0)]);

    // speed = 0 (pause-by-speed)
    const a = VClock.make(tl, { startAt: 100, speed: 0 });
    const a0 = a.get();
    const a1 = a.advance(500);
    expect(VTime.toMsecs(a0.vtime)).to.eql(100);
    expect(VTime.toMsecs(a1.vtime)).to.eql(100);

    // explicit pause()
    const b = VClock.make(tl, { startAt: 100, speed: 1 });
    b.pause();
    const b1 = b.advance(500);
    expect(VTime.toMsecs(b1.vtime)).to.eql(100);
  });
});

/**
 * Helpers:
 */
const seg = (vFrom: t.Msecs, vTo: t.Msecs, oFrom: t.Msecs) => {
  return {
    virtual: { from: vFrom, to: vTo },
    original: { from: oFrom, to: oFrom + (vTo - vFrom) },
  } as t.TimecodeResolvedSegment;
};

const resolved = (total: t.Msecs, segments: readonly t.TimecodeResolvedSegment[]) => {
  return { total, segments } as t.TimecodeResolved;
};
