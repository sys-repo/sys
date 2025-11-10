import { type t, c, describe, expect, it } from '../../-test.ts';
import { Composite } from './mod.ts';

const asMs = (n: number) => n as t.Msecs;
const slice = (s: string) => s as t.TimecodeSliceString;

describe('Composite', () => {
  const SRC_A = 'A.mp4';
  const SRC_B = 'B.mp4';
  const DURS: t.TimecodeDurationMap = { [SRC_A]: asMs(120_000), [SRC_B]: asMs(90_000) };

  const SPEC: t.TimecodeCompositionSpec = [
    { src: SRC_A, slice: slice('..00:01:00') }, // A: 0..60s
    { src: SRC_B, slice: slice('00:00:10..') }, // B: 10..end → 10..90 (80s)
  ];

  describe('normalize', () => {
    it('trims src, drops empty entries, and preserves slice', () => {
      const spec: t.TimecodeCompositionSpec = [
        { src: ` ${SRC_A} `, slice: slice('..00:00:05') },
        { src: '  ', slice: slice('00:00:01..00:00:02') }, // dropped
        { src: SRC_B }, // no slice
      ];

      const out = Composite.normalize(spec);

      expect(out.length).to.eql(2);
      expect(out[0].src).to.eql(SRC_A);
      expect(out[0].slice).to.eql(String(slice('..00:00:05')).trim());
      expect(out[1].src).to.eql(SRC_B);
      expect(out[1]).to.not.have.property('slice');

      // Print:
      console.info(c.cyan('\nComposite.normalize'));
      console.log(out, '\n');
    });

    it('trims slice string', () => {
      const spec: t.TimecodeCompositionSpec = [{ src: SRC_A, slice: '  00:00:01..00:00:02  ' }];
      const out = Composite.normalize(spec);
      expect(out).to.eql([{ src: SRC_A, slice: '00:00:01..00:00:02' }]);
    });

    it('is idempotent on already-normalized input', () => {
      const spec: t.TimecodeCompositionSpec = [{ src: SRC_A, slice: '..00:00:05' }, { src: SRC_B }];
      const once = Composite.normalize(spec);
      const twice = Composite.normalize(once);
      expect(twice).to.eql(once);
    });

    it('preserves order and returns new array/objects', () => {
      const a = { src: ` ${SRC_A} `, slice: '..00:00:05' } as const;
      const b = { src: SRC_B } as const;
      const spec = [a, b] as unknown as t.TimecodeCompositionSpec;
      const out = Composite.normalize(spec);

      expect(out.map((p) => p.src)).to.eql([SRC_A, SRC_B]); // order
      expect(out).to.not.equal(spec); // new array instance
      expect(out[0]).to.not.equal(a); // new object instances
      expect(out[1]).to.not.equal(b);
    });

    it('treats empty/whitespace slice as absent', () => {
      const spec: t.TimecodeCompositionSpec = [
        { src: SRC_A, slice: '' },
        { src: SRC_B, slice: '   ' },
      ];
      const out = Composite.normalize(spec);
      expect(out[0]).to.eql({ src: SRC_A });
      expect(out[1]).to.eql({ src: SRC_B });
    });

    it('coerces non-string slice via String()', () => {
      const weird = { toString: () => '..00:00:03' };
      const spec: t.TimecodeCompositionSpec = [{ src: SRC_A, slice: weird as any }];
      const out = Composite.normalize(spec);
      expect(out).to.eql([{ src: SRC_A, slice: '..00:00:03' }]);
    });

    it('handles empty input', () => {
      const out = Composite.normalize([]);
      expect(out).to.eql([]);
    });
  });

  describe('validate', () => {
    it('ok for valid slices and present durations', () => {
      const r = Composite.validate(SPEC, DURS);
      expect(r.ok).to.eql(true);
      expect(r.issues.length).to.eql(0);
    });

    it('flags missing duration', () => {
      const r = Composite.validate([{ src: 'X.mp4' }], DURS);
      expect(r.ok).to.eql(false);
      expect(r.issues[0]).to.eql({ kind: 'missing-duration', src: 'X.mp4' });
    });

    it('flags invalid slice grammar', () => {
      const bad: t.TimecodeCompositionSpec = [{ src: SRC_A, slice: slice('bogus') }];
      const r = Composite.validate(bad, DURS);
      expect(r.ok).to.eql(false);
      expect(r.issues[0].kind).to.eql('invalid-slice');
      expect((r.issues[0] as any).src).to.eql(SRC_A);
    });

    it('flags zero-length segment', () => {
      const z: t.TimecodeCompositionSpec = [{ src: SRC_A, slice: slice('00:00:05..00:00:05') }];
      const r = Composite.validate(z, DURS);
      expect(r.ok).to.eql(false);
      expect(r.issues[0]).to.eql({ kind: 'zero-length-segment', src: SRC_A });
    });
  });

  describe('resolve', () => {
    it('builds segments with virtual accumulated; spans are half-open', () => {
      const resolved = Composite.resolve(SPEC, DURS);
      expect(resolved.total).to.eql(asMs(60_000 + 80_000));

      const [s0, s1] = resolved.segments;
      expect(s0.src).to.eql(SRC_A);
      expect(s0.original.from).to.eql(asMs(0));
      expect(s0.original.to).to.eql(asMs(60_000));
      expect(s0.virtual.from).to.eql(asMs(0));
      expect(s0.virtual.to).to.eql(asMs(60_000));

      expect(s1.src).to.eql(SRC_B);
      expect(s1.original.from).to.eql(asMs(10_000));
      expect(s1.original.to).to.eql(asMs(90_000));
      expect(s1.virtual.from).to.eql(asMs(60_000));
      expect(s1.virtual.to).to.eql(asMs(140_000));
    });

    it('drops pieces with non-positive durations', () => {
      const res = Composite.resolve([{ src: 'X' }], { X: asMs(0) });
      expect(res.segments.length).to.eql(0);
      expect(res.total).to.eql(asMs(0));
    });
  });

  describe('mapToSource', () => {
    const resolved = Composite.resolve(SPEC, DURS);

    it('maps inside range', () => {
      const r = Composite.mapToSource(resolved.segments, asMs(65_000))!;
      expect(r.index).to.eql(1);
      expect(r.seg.src).to.eql(SRC_B);
      expect(r.offset).to.eql(asMs(5_000)); // 65_000 - 60_000
      expect(r.srcTime).to.eql(asMs(10_000 + 5_000)); // original.from + offset
    });

    it('null outside [0,total)', () => {
      expect(Composite.mapToSource(resolved.segments, asMs(-1))).to.eql(null);
      expect(Composite.mapToSource(resolved.segments, resolved.total)).to.eql(null); // exclusive end
    });
  });

  describe('cursor', () => {
    const resolved = Composite.resolve(SPEC, DURS);
    const cur = Composite.cursor(resolved);

    it('at(v) mirrors mapToSource', () => {
      expect(cur.at(asMs(0))!.index).to.eql(0);
      expect(cur.at(asMs(59_999))!.index).to.eql(0);
      expect(cur.at(asMs(60_000))!.index).to.eql(1);
      expect(cur.at(resolved.total)).to.eql(null);
    });

    it('next/prev indices', () => {
      expect(cur.next(-1)).to.eql(0);
      expect(cur.next(0)).to.eql(1);
      expect(cur.next(1)).to.eql(null);
      expect(cur.prev(1)).to.eql(0);
      expect(cur.prev(0)).to.eql(null);
    });
  });

  describe('Time', () => {
    const resolved = Composite.resolve(SPEC, DURS);

    it('toVirtual clamps to [virtual.from, virtual.to) by exclusive end', () => {
      const s0 = resolved.segments[0];
      const justPast = asMs(s0.original.to + 999);
      const atEnd = Composite.Time.toVirtual(resolved.segments, 0, justPast);
      expect(atEnd).to.eql(asMs(s0.virtual.to - 1)); // exclusive end safe
    });

    it('clamp keeps inside [0,total) (exclusive end)', () => {
      const { total } = resolved;
      expect(Composite.Time.clamp(asMs(-10), total)).to.eql(asMs(0));
      expect(Composite.Time.clamp(total, total)).to.eql(asMs(total - 1));
      expect(Composite.Time.clamp(asMs(10), total)).to.eql(asMs(10));
    });
  });

  describe('Ops', () => {
    it('concat rebases second timeline (virtual spans)', () => {
      const A = Composite.resolve([{ src: SRC_A, slice: slice('..00:00:10') }], DURS);
      const B = Composite.resolve([{ src: SRC_B, slice: slice('..00:00:05') }], DURS);
      const C = Composite.Ops.concat(A, B);
      expect(C.total).to.eql(asMs(10_000 + 5_000));
      expect(C.segments[1].virtual.from).to.eql(asMs(10_000));
      expect(C.segments[1].virtual.to).to.eql(asMs(15_000));
    });

    it('splice inserts and re-bases after segments', () => {
      const base = Composite.resolve(SPEC, DURS); // [60s of A] [80s of B]
      const insert: t.TimecodeCompositionSpec = [
        { src: SRC_A, slice: slice('00:00:30..00:00:40') },
      ];
      const sp = Composite.Ops.splice(base, 1, insert, DURS);

      console.info();
      console.info(c.cyan(`Composite.Ops.splice:`));
      console.info(sp);
      console.info();

      // Expect: A(0..60) + insert(A 30..40) + B(10..90), virtual spans rebased
      expect(sp.segments.length).to.eql(3);
      expect(sp.segments[0].virtual.from).to.eql(asMs(0));
      expect(sp.segments[0].virtual.to).to.eql(asMs(60_000));

      expect(sp.segments[1].original.from).to.eql(asMs(30_000));
      expect(sp.segments[1].original.to).to.eql(asMs(40_000));
      expect(sp.segments[1].virtual.from).to.eql(asMs(60_000));
      expect(sp.segments[1].virtual.to).to.eql(asMs(70_000));

      expect(sp.segments[2].virtual.from).to.eql(asMs(70_000));
      expect(sp.segments[2].virtual.to).to.eql(asMs(150_000)); // 70k + 80s
      expect(sp.total).to.eql(asMs(150_000));
    });
  });

  describe('Durations', () => {
    it('diff reports changed keys (including additions)', async () => {
      const prev: t.TimecodeDurationMap = { [SRC_A]: asMs(1), [SRC_B]: asMs(2) };
      const next: t.TimecodeDurationMap = { [SRC_A]: asMs(1), [SRC_B]: asMs(3), X: asMs(4) };
      const d = Composite.Durations.diff(prev, next);
      expect(d).to.eql([SRC_B, 'X']);
    });

    it('probe placeholder returns zeros', async () => {
      const m = await Composite.Durations.probe([SRC_A, SRC_B]);
      expect(m[SRC_A]).to.eql(asMs(0));
      expect(m[SRC_B]).to.eql(asMs(0));
    });
  });
});
