import { type t, c, describe, expect, it } from '../../../-test.ts';
import { Composite } from '../mod.ts';

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

    it('preserves numeric duration on normalize()', () => {
      const spec: t.TimecodeCompositionSpec = [
        { src: ` ${SRC_A} `, slice: slice('..00:00:05'), duration: asMs(120_000) },
        { src: SRC_B, duration: asMs(90_000) },
      ];

      const out = Composite.normalize(spec);

      expect(out.length).to.eql(2);
      expect(out[0]).to.eql({ src: SRC_A, slice: '..00:00:05', duration: asMs(120_000) });
      expect(out[1]).to.eql({ src: SRC_B, duration: asMs(90_000) });
    });

    it('drops empty src entries and does not affect duration on valid items', () => {
      const spec: t.TimecodeCompositionSpec = [
        { src: '  ', duration: asMs(1) }, // dropped (empty src)
        { src: SRC_A, duration: asMs(2) }, // kept
      ];
      const out = Composite.normalize(spec);
      expect(out).to.eql([{ src: SRC_A, duration: asMs(2) }]);
    });

    it('is idempotent with duration present', () => {
      const spec: t.TimecodeCompositionSpec = [
        { src: SRC_A, slice: '..00:00:05', duration: asMs(120_000) },
        { src: SRC_B, duration: asMs(90_000) },
      ];
      const once = Composite.normalize(spec);
      const twice = Composite.normalize(once);
      expect(twice).to.eql(once);
    });

    describe('normalize (duration semantics)', () => {
      it('preserves finite non-negative duration (including 0)', () => {
        const spec: t.TimecodeCompositionSpec = [
          { src: SRC_A, duration: asMs(0) },
          { src: SRC_B, duration: asMs(90_000) },
        ];
        const out = Composite.normalize(spec);
        expect(out).to.eql([
          { src: SRC_A, duration: asMs(0) },
          { src: SRC_B, duration: asMs(90_000) },
        ]);
      });

      it('trims src and preserves duration', () => {
        const spec: t.TimecodeCompositionSpec = [{ src: `  ${SRC_A}  `, duration: asMs(12_345) }];
        const out = Composite.normalize(spec);
        expect(out).to.eql([{ src: SRC_A, duration: asMs(12_345) }]);
      });

      it('drops non-finite or negative duration (Infinity, -1, NaN)', () => {
        const spec: t.TimecodeCompositionSpec = [
          { src: SRC_A, duration: Number.POSITIVE_INFINITY as t.Msecs },
          { src: SRC_B, duration: -1 as t.Msecs },
          { src: 'X.mp4', duration: Number.NaN as t.Msecs },
        ];
        const out = Composite.normalize(spec);
        expect(out).to.eql([{ src: SRC_A }, { src: SRC_B }, { src: 'X.mp4' }]);
      });

      it('does not coerce non-number duration (e.g., string) — drops it', () => {
        const spec: t.TimecodeCompositionSpec = [
          { src: SRC_A, duration: '120000' as unknown as t.Msecs },
        ];
        const out = Composite.normalize(spec);
        expect(out).to.eql([{ src: SRC_A }]);
      });

      it('is idempotent when duration is valid or absent', () => {
        const spec: t.TimecodeCompositionSpec = [
          { src: SRC_A, duration: asMs(120_000) },
          { src: SRC_B }, // no duration
        ];
        const once = Composite.normalize(spec);
        const twice = Composite.normalize(once);
        expect(twice).to.eql(once);
      });
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
      expect((r.issues[0] as any).src).to.eql(SRC_A);
      expect(r.issues[0].kind).to.eql('invalid-slice');
    });

    it('flags zero-length segment', () => {
      const z: t.TimecodeCompositionSpec = [{ src: SRC_A, slice: slice('00:00:05..00:00:05') }];
      const r = Composite.validate(z, DURS);
      expect(r.ok).to.eql(false);
      expect(r.issues[0]).to.eql({ kind: 'zero-length-segment', src: SRC_A });
    });

    it('ok when piece has inline duration without map entry', () => {
      const spec: t.TimecodeCompositionSpec = [{ src: 'X.mp4', duration: asMs(10_000) }];
      const r = Composite.validate(spec, {} as t.TimecodeDurationMap);
      expect(r.ok).to.eql(true);
      expect(r.issues).to.eql([]);
    });

    it('flags missing duration when neither inline nor map provides a finite value', () => {
      const spec: t.TimecodeCompositionSpec = [{ src: 'X.mp4' }];
      const r = Composite.validate(spec, {} as t.TimecodeDurationMap);
      expect(r.ok).to.eql(false);
      expect(r.issues[0]).to.eql({ kind: 'missing-duration', src: 'X.mp4' });
    });

    it('flags missing duration when inline is non-finite (NaN/±Infinity/negative)', () => {
      const bads: t.TimecodeCompositionSpec = [
        { src: SRC_A, duration: Number.NaN as t.Msecs },
        { src: SRC_B, duration: Number.POSITIVE_INFINITY as t.Msecs },
        { src: 'Y.mp4', duration: -1 as t.Msecs },
      ];
      const r = Composite.validate(bads, {} as t.TimecodeDurationMap);
      expect(r.ok).to.eql(false);
      expect(r.issues.map((i) => i.src)).to.eql([SRC_A, SRC_B, 'Y.mp4']);
    });

    it('prefers inline duration over map (validation passes regardless of map value)', () => {
      const spec: t.TimecodeCompositionSpec = [{ src: SRC_A, duration: asMs(5000) }];
      const map: t.TimecodeDurationMap = { [SRC_A]: asMs(120_000) };
      const r = Composite.validate(spec, map);
      expect(r.ok).to.eql(true);
      expect(r.issues).to.eql([]);
    });

    it('prefers inline duration over duration map', () => {
      const spec: t.TimecodeCompositionSpec = [
        { src: SRC_A, slice: slice('..-00:00:08'), duration: asMs(10_000) }, // total=10s ⇒ 0..(10s-8s)=2s
      ];
      const res = Composite.resolve(spec, { [SRC_A]: asMs(120_000) }); // map says 120s, should be ignored
      expect(res.total).to.eql(asMs(2_000));
      expect(res.segments.length).to.eql(1);
      expect(res.segments[0].original.from).to.eql(asMs(0));
      expect(res.segments[0].original.to).to.eql(asMs(2_000));
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
      expect(C.segments.length).to.eql(2);
      expect(C.segments[0].src).to.eql(SRC_A);
      expect(C.segments[1].src).to.eql(SRC_B);
      expect(C.segments[1].virtual.from).to.eql(asMs(10_000));
      expect(C.segments[1].virtual.to).to.eql(asMs(15_000));
    });

    it('splice inserts and re-bases after segments', () => {
      // Base: [A: 0..60s] [B: 10..90s] → virtual [0..60] [60..140]
      const base = Composite.resolve(SPEC, DURS);
      const insert: t.TimecodeCompositionSpec = [
        { src: SRC_A, slice: slice('00:00:30..00:00:40') }, // 10s clip
      ];
      const sp = Composite.Ops.splice(base, 1, insert, DURS);

      // Expect: A(0..60) + insert(A 30..40) + B(10..90), virtual spans rebased
      expect(sp.segments.length).to.eql(3);

      expect(sp.segments[0].virtual).to.eql({ from: asMs(0), to: asMs(60_000) });

      expect(sp.segments[1].original).to.eql({ from: asMs(30_000), to: asMs(40_000) });
      expect(sp.segments[1].virtual).to.eql({ from: asMs(60_000), to: asMs(70_000) });

      expect(sp.segments[2].virtual).to.eql({ from: asMs(70_000), to: asMs(150_000) });
      expect(sp.total).to.eql(asMs(150_000));
    });

    it('splice: inserted pieces prefer inline duration over map', () => {
      const base = Composite.resolve(
        [{ src: SRC_A, slice: slice('..00:00:02') }],
        { [SRC_A]: asMs(2_000) }, // key matches src "A.mp4"
      );
      // Map says 8s, inline says 2s → must use 2s
      const insert: t.TimecodeCompositionSpec = [
        { src: SRC_B, duration: asMs(2_000), slice: slice('..00:00:02') },
      ];
      const res = Composite.Ops.splice(
        base,
        1,
        insert,
        { [SRC_B]: asMs(8_000) }, // map exists but should be ignored in favor of inline
      );

      expect(res.segments.map((s) => s.src)).to.eql([SRC_A, SRC_B]);
      expect(res.segments[0].virtual).to.eql({ from: asMs(0), to: asMs(2_000) });
      expect(res.segments[1].virtual).to.eql({ from: asMs(2_000), to: asMs(4_000) });
      expect(res.total).to.eql(asMs(4_000));
    });

    it('splice: open-end slice uses inline total for resolution (no map)', () => {
      // Base: A 1s
      const base = Composite.resolve(
        [{ src: SRC_A, slice: slice('..00:00:01') }],
        { [SRC_A]: asMs(1_000) }, // correct key
      );

      // Insert: B duration 3s, slice "1s..end" ⇒ 2s segment
      const insert: t.TimecodeCompositionSpec = [
        { src: SRC_B, duration: asMs(3_000), slice: slice('00:00:01..') },
      ];
      const res = Composite.Ops.splice(base, 1, insert, {}); // no map for B (inline wins)

      expect(res.segments.map((s) => s.src)).to.eql([SRC_A, SRC_B]);
      expect(res.segments[0].virtual).to.eql({ from: asMs(0), to: asMs(1_000) });

      const segB = res.segments[1];
      expect(segB.original).to.eql({ from: asMs(1_000), to: asMs(3_000) }); // 1s..3s of B
      expect(segB.virtual).to.eql({ from: asMs(1_000), to: asMs(3_000) }); // appended after base

      expect(res.total).to.eql(asMs(3_000)); // 1s base + 2s insert
    });

    it('splice: drops zero-length inserted segments and re-bases following segments', () => {
      const base = Composite.resolve(
        [
          { src: SRC_A, slice: slice('..00:00:02') },
          { src: SRC_B, slice: slice('..00:00:02') },
        ],
        { [SRC_A]: asMs(2_000), [SRC_B]: asMs(2_000) }, // correct keys
      );

      const insert: t.TimecodeCompositionSpec = [
        { src: 'X', duration: asMs(0) }, // zero-length → dropped
        { src: 'Y', duration: asMs(2_000), slice: slice('00:00:01..00:00:02') }, // 1s
      ];

      const res = Composite.Ops.splice(base, 1, insert, {}); // insert between A and B

      expect(res.segments.map((s) => s.src)).to.eql([SRC_A, 'Y', SRC_B]);
      expect(res.segments[0].virtual).to.eql({ from: asMs(0), to: asMs(2_000) });
      expect(res.segments[1].virtual).to.eql({ from: asMs(2_000), to: asMs(3_000) });
      expect(res.segments[2].virtual).to.eql({ from: asMs(3_000), to: asMs(5_000) });
      expect(res.total).to.eql(asMs(5_000));
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

    describe('with', () => {
      it('fills missing finite durations from map', () => {
        const spec: t.TimecodeCompositionSpec = [{ src: SRC_A }, { src: SRC_B }];
        const map: t.TimecodeDurationMap = { [SRC_A]: asMs(1000), [SRC_B]: asMs(2000) };
        const out = Composite.Durations.with(spec, map);

        expect(out).to.eql([
          { src: SRC_A, duration: asMs(1000) },
          { src: SRC_B, duration: asMs(2000) },
        ]);
      });

      it('preserves inline finite duration over map value', () => {
        const spec: t.TimecodeCompositionSpec = [
          { src: SRC_A, duration: asMs(9999) },
          { src: SRC_B },
        ];
        const map: t.TimecodeDurationMap = { [SRC_A]: asMs(1), [SRC_B]: asMs(2) };
        const out = Composite.Durations.with(spec, map);

        expect(out).to.eql([
          { src: SRC_A, duration: asMs(9999) },
          { src: SRC_B, duration: asMs(2) },
        ]);
      });

      it('drops non-finite or negative durations from map and inline', () => {
        const spec: t.TimecodeCompositionSpec = [
          { src: SRC_A, duration: Number.POSITIVE_INFINITY as t.Msecs },
          { src: SRC_B, duration: -1 as t.Msecs },
          { src: 'C.mp4' },
        ];
        const map: t.TimecodeDurationMap = {
          [SRC_A]: asMs(10),
          [SRC_B]: Number.NaN as t.Msecs,
          'C.mp4': asMs(300),
        };

        const out = Composite.Durations.with(spec, map);
        expect(out).to.eql([
          { src: SRC_A, duration: asMs(10) },
          { src: SRC_B },
          { src: 'C.mp4', duration: asMs(300) },
        ]);
      });

      it('returns normalized spec and remains idempotent', () => {
        const spec: t.TimecodeCompositionSpec = [{ src: ` ${SRC_A} ` }, { src: SRC_B }];
        const map: t.TimecodeDurationMap = { [SRC_A]: asMs(100), [SRC_B]: asMs(200) };
        const once = Composite.Durations.with(spec, map);
        const twice = Composite.Durations.with(once, map);

        expect(once).to.eql([
          { src: SRC_A, duration: asMs(100) },
          { src: SRC_B, duration: asMs(200) },
        ]);
        expect(twice).to.eql(once);
      });

      it('does not add duration when missing in both inline and map', () => {
        const spec: t.TimecodeCompositionSpec = [{ src: SRC_A }];
        const map: t.TimecodeDurationMap = {};
        const out = Composite.Durations.with(spec, map);
        expect(out).to.eql([{ src: SRC_A }]);
      });
    });
  });
});
