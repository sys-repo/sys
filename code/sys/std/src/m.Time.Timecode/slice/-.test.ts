import { type t, describe, expect, it } from '../../-test.ts';
import { Slice } from './mod.ts';

describe('Timecode.Slice', () => {
  describe('is(): lexical truth table', () => {
    it('valid cases', () => {
      const ok: readonly string[] = [
        '00:00..00:10',
        '00:00:05..00:00:10',
        '..00:00:10',
        '00:01..',
        '00:00:05..-00:00:02',
        '-00:00:05..',
        '..-00:00:05',
        '00:10:00..00:10:00.250',
        '00:59..01:00', // minutes bounds respected by regex
      ];
      for (const s of ok) {
        expect(Slice.is(s)).to.eql(true, `expected valid: ${s}`);
      }
    });

    it('invalid cases', () => {
      const bad: readonly unknown[] = [
        null,
        undefined,
        123,
        {},
        [],
        '00:10', //                 no separator
        'foo..bar',
        '00:60..00:00', //          invalid mm
        '00:00..00:60', //          invalid ss
        '00:0..00:02', //           single-digit mm
        '00:00:5..00:00:10', //     single-digit ss
        '....', //                  not valid VTT bounds
        '00:00..00:00..00:01', //   multiple separators
        '-..00:10', //              invalid negative syntax
      ];
      for (const s of bad) {
        expect(Slice.is(s)).to.eql(false, `expected invalid: ${String(s)}`);
      }
    });

    it('narrowing to branded string', () => {
      const input: unknown = '00:00:05..00:00:10';

      if (Slice.is(input)) {
        // compile-time: prove the guard narrows to the branded string
        type _Narrow = t.Type.AssertExtends<typeof input, t.TimecodeSliceString>;

        // input is narrowed to TimecodeSliceString within this block
        const branded = input;
        type _Eq = t.Type.AssertExtends<typeof branded, t.TimecodeSliceString>;

        expect(branded).to.eql('00:00:05..00:00:10');
      } else {
        expect.fail('expected is() to pass for valid slice');
      }
    });
  });

  describe('parse(): structure + bound kinds', () => {
    it('absolute → absolute', () => {
      const raw = '00:00:05..00:00:10' as t.TimecodeSliceString;
      const p = Slice.parse(raw);
      expect(p.raw).to.eql(raw);
      expect(p.start.kind).to.eql('abs');
      expect(p.end.kind).to.eql('abs');
      expect(p.start).to.have.property('ms');
      expect(p.end).to.have.property('ms');
    });

    it('open start', () => {
      const p = Slice.parse('..00:00:10' as t.TimecodeSliceString);
      expect(p.start.kind).to.eql('open');
      expect(p.end.kind).to.eql('abs');
    });

    it('open end', () => {
      const p = Slice.parse('00:01..' as t.TimecodeSliceString);
      expect(p.start.kind).to.eql('abs');
      expect(p.end.kind).to.eql('open');
    });

    it('relative-from-end in end bound', () => {
      const p = Slice.parse('00:00:05..-00:00:02' as t.TimecodeSliceString);
      expect(p.start.kind).to.eql('abs');
      expect(p.end.kind).to.eql('relEnd');
      expect(p.end).to.have.property('ms');
    });

    it('relative-from-end in start bound', () => {
      const p = Slice.parse('-00:00:05..' as t.TimecodeSliceString);
      expect(p.start.kind).to.eql('relEnd');
      expect(p.end.kind).to.eql('open');
    });

    it('throws on invalid input (defensive)', () => {
      const bad = '00:99..00:00' as unknown as t.TimecodeSliceString;
      const fn = () => Slice.parse(bad);
      expect(fn).to.throw(Error);
    });
  });

  describe('resolve(): absolute millisecond windows', () => {
    const total: t.Msecs = 120_000; // 2 minutes

    it('absolute range', () => {
      const s = Slice.parse('00:00:05..00:00:10' as t.TimecodeSliceString);
      const r = Slice.resolve(s, total);
      expect(r).to.eql({ from: 5_000, to: 10_000 });
    });

    it('open start → from 0', () => {
      const s = Slice.parse('..00:00:10' as t.TimecodeSliceString);
      const r = Slice.resolve(s, total);
      expect(r).to.eql({ from: 0, to: 10_000 });
    });

    it('open end → to total', () => {
      const s = Slice.parse('01:00..' as t.TimecodeSliceString);
      const r = Slice.resolve(s, total);
      expect(r).to.eql({ from: 60_000, to: 120_000 });
    });

    it('relEnd in end bound', () => {
      const s = Slice.parse('01:00..-00:00:10' as t.TimecodeSliceString);
      const r = Slice.resolve(s, total);
      expect(r).to.eql({ from: 60_000, to: 110_000 });
    });

    it('relEnd in start bound', () => {
      const s = Slice.parse('-00:00:10..' as t.TimecodeSliceString);
      const r = Slice.resolve(s, total);
      expect(r).to.eql({ from: 110_000, to: 120_000 });
    });

    it('coerces when start > end (swapped inputs)', () => {
      const s = Slice.parse('00:00:10..00:00:05' as t.TimecodeSliceString);
      const r = Slice.resolve(s, total);
      expect(r).to.eql({ from: 5_000, to: 10_000 });
    });

    it('clamps outside total: huge relEnd becomes < 0', () => {
      const s = Slice.parse('-00:05:00..' as t.TimecodeSliceString); // start = total - 300_000 = -180_000 → clamp to 0
      const r = Slice.resolve(s, total);
      expect(r).to.eql({ from: 0, to: 120_000 });
    });

    it('clamps absolute beyond total', () => {
      const s = Slice.parse('00:03:00..00:04:00' as t.TimecodeSliceString); // both beyond total
      const r = Slice.resolve(s, total);
      expect(r).to.eql({ from: 120_000, to: 120_000 });
    });

    it('mixed: open start to relEnd', () => {
      const s = Slice.parse('..-00:00:30' as t.TimecodeSliceString);
      const r = Slice.resolve(s, total);
      expect(r).to.eql({ from: 0, to: 90_000 });
    });
  });
});
