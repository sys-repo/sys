import { type t, describe, expect, it } from '../../../-test.ts';
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

  describe('mapToSource', () => {
    const resolved = Composite.resolve(SPEC, DURS);

    it('maps inside range', () => {
      const r = Composite.Map.toSource(resolved.segments, asMs(65_000))!;
      expect(r.index).to.eql(1);
      expect(r.seg.src).to.eql(SRC_B);
      expect(r.offset).to.eql(asMs(5_000)); // 65_000 - 60_000
      expect(r.srcTime).to.eql(asMs(10_000 + 5_000)); // original.from + offset
    });

    it('null outside [0,total)', () => {
      expect(Composite.Map.toSource(resolved.segments, asMs(-1))).to.eql(null);
      expect(Composite.Map.toSource(resolved.segments, resolved.total)).to.eql(null); // exclusive end
    });
  });
});
