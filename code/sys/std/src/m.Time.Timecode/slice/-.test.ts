import { type t, describe, expect, it } from '../../-test.ts';
import { Slice } from './mod.ts';

const ms = (n: number): t.Msecs => n;
const secs = (n: number): t.Secs => n;

describe('Timecode.Slice', () => {
  describe('is(): lexical truth table', () => {
    it('valid cases', () => {
      const ok: string[] = [
        '00:00..00:10',
        '00:00:05..00:00:10',
        '..00:00:10',
        '00:01..',
        '00:00:05..-00:00:02',
        '-00:00:05..',
        '..-00:00:05',
        '00:10:00..00:10:00.250',
        '00:59..01:00',
        '00:11:30..-00:10:00',
      ];
      for (const s of ok) expect(Slice.is(s)).to.eql(true, `expected valid: ${s}`);
    });

    it('invalid cases', () => {
      const bad: unknown[] = [
        null,
        undefined,
        123,
        {},
        [],
        '00:10', // no separator
        'foo..bar',
        '00:60..00:00', // invalid mm
        '00:00..00:60', // invalid ss
        '00:0..00:02', // single-digit mm
        '00:00:5..00:00:10', // single-digit ss
        '....', // not valid VTT bounds
        '00:00..00:00..00:01', // multiple separators
        '-..00:10', // invalid negative syntax
      ];
      for (const s of bad) expect(Slice.is(s)).to.eql(false, `expected invalid: ${String(s)}`);
    });

    it('narrowing to branded string', () => {
      const input: unknown = '00:00:05..00:00:10';
      if (Slice.is(input)) {
        type _Narrow = t.Type.AssertExtends<typeof input, t.TimecodeSliceString>;
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
    const total: t.Msecs = ms(120_000); // 2 minutes

    it('absolute range', () => {
      const s = Slice.parse('00:00:05..00:00:10' as t.TimecodeSliceString);
      const r = Slice.resolve(s, total);
      expect(r).to.eql({ from: ms(5_000), to: ms(10_000) });
    });

    it('open start → from 0', () => {
      const s = Slice.parse('..00:00:10' as t.TimecodeSliceString);
      const r = Slice.resolve(s, total);
      expect(r).to.eql({ from: ms(0), to: ms(10_000) });
    });

    it('open end → to total', () => {
      const s = Slice.parse('01:00..' as t.TimecodeSliceString);
      const r = Slice.resolve(s, total);
      expect(r).to.eql({ from: ms(60_000), to: ms(120_000) });
    });

    it('relEnd in end bound', () => {
      const s = Slice.parse('01:00..-00:00:10' as t.TimecodeSliceString);
      const r = Slice.resolve(s, total);
      expect(r).to.eql({ from: ms(60_000), to: ms(110_000) });
    });

    it('relEnd in start bound', () => {
      const s = Slice.parse('-00:00:10..' as t.TimecodeSliceString);
      const r = Slice.resolve(s, total);
      expect(r).to.eql({ from: ms(110_000), to: ms(120_000) });
    });

    it('coerces when start > end (swapped inputs)', () => {
      const s = Slice.parse('00:00:10..00:00:05' as t.TimecodeSliceString);
      const r = Slice.resolve(s, total);
      expect(r).to.eql({ from: ms(5_000), to: ms(10_000) });
    });

    it('clamps outside total: huge relEnd becomes < 0', () => {
      const s = Slice.parse('-00:05:00..' as t.TimecodeSliceString);
      const r = Slice.resolve(s, total);
      expect(r).to.eql({ from: ms(0), to: ms(120_000) });
    });

    it('clamps absolute beyond total', () => {
      const s = Slice.parse('00:03:00..00:04:00' as t.TimecodeSliceString);
      const r = Slice.resolve(s, total);
      expect(r).to.eql({ from: ms(120_000), to: ms(120_000) });
    });

    it('mixed: open start to relEnd', () => {
      const s = Slice.parse('..-00:00:30' as t.TimecodeSliceString);
      const r = Slice.resolve(s, total);
      expect(r).to.eql({ from: ms(0), to: ms(90_000) });
    });

    it('absolute → relEnd ("00:11:30..-00:10:00")', () => {
      const total30m = ms(30 * 60 * 1000); // 30 minutes
      const s = Slice.parse('00:11:30..-00:10:00' as t.TimecodeSliceString);
      const r = Slice.resolve(s, total30m);
      expect(r).to.eql({ from: ms(690_000), to: ms(1_200_000) }); // 11:30 → 20:00
    });
  });

  describe('from()', () => {
    it('absolute → absolute (no total)', () => {
      const s = Slice.from({ from: ms(10_000), to: ms(20_000) });
      expect(s).to.eql('00:00:10..00:00:20');
    });

    it('open start when from === 0 and total is provided', () => {
      const s = Slice.from({ from: ms(0), to: ms(60_000) }, ms(60_000));
      expect(s).to.eql('..00:01:00');
    });

    it('open end when to === total and total is provided', () => {
      const s = Slice.from({ from: ms(30_000), to: ms(90_000) }, ms(90_000));
      expect(s).to.eql('00:00:30..');
    });

    it('keeps absolute ends when total provided but not aligned to [0,total)', () => {
      const s = Slice.from({ from: ms(5_000), to: ms(55_000) }, ms(60_000));
      expect(s).to.eql('00:00:05..00:00:55');
    });
  });

  describe('toString()', () => {
    describe('toString() - branded string input', () => {
      it('struct: abs..abs', () => {
        const str = Slice.toString({
          raw: 'ignored' as t.TimecodeSliceString,
          start: { kind: 'abs', ms: ms(5_000) },
          end: { kind: 'abs', ms: ms(10_000) },
        });
        expect(str).to.eql('00:00:05..00:00:10');
      });

      it('struct: open..abs', () => {
        const str = Slice.toString({
          raw: 'ignored' as t.TimecodeSliceString,
          start: { kind: 'open' },
          end: { kind: 'abs', ms: ms(60_000) },
        });
        expect(str).to.eql('..00:01:00');
      });

      it('struct: abs..open', () => {
        const str = Slice.toString({
          raw: 'ignored' as t.TimecodeSliceString,
          start: { kind: 'abs', ms: ms(30_000) },
          end: { kind: 'open' },
        });
        expect(str).to.eql('00:00:30..');
      });

      it('struct: abs..relEnd', () => {
        const str = Slice.toString({
          raw: 'ignored' as t.TimecodeSliceString,
          start: { kind: 'abs', ms: ms(5_000) },
          end: { kind: 'relEnd', ms: ms(2_000) },
        });
        expect(str).to.eql('00:00:05..-00:00:02');
      });
    });

    describe('toString() - raw string input', () => {
      it('empty input', () => {
        expect(Slice.toString(undefined)).to.eql('');
        expect(Slice.toString()).to.eql('');
        expect(Slice.toString('')).to.eql('');
        expect(Slice.toString('  ')).to.eql('');
      });

      it('normalizes whitespace around ".."', () => {
        const str = Slice.toString('  00:00:05  ..  00:00:10  ');
        expect(str).to.eql('00:00:05..00:00:10');
      });

      it('returns empty string when missing delimiter', () => {
        const str = Slice.toString('00:00:05');
        expect(str).to.eql('');
      });
    });
  });

  describe('round-trip properties: resolve() → from() → toString() → parse()', () => {
    const total = ms(140_000);

    it('from(resolve(parse(str))) === canonical str (open end)', () => {
      const str = '..00:01:00' as t.TimecodeSliceString;
      const win = Slice.resolve(Slice.parse(str), total);
      expect(Slice.from(win, total)).to.eql('..00:01:00');
    });

    it('toString(parse(str)) === canonical str', () => {
      const str = '00:00:10..-00:00:02' as t.TimecodeSliceString;
      expect(Slice.toString(Slice.parse(str))).to.eql(str);
    });
  });

  describe('split()', () => {
    it('empty/undefined → {start:"", end:""}', () => {
      expect(Slice.split()).to.eql({ start: '', end: '' });
      expect(Slice.split('')).to.eql({ start: '', end: '' });
    });

    it('no separator → {start:"", end:""} (defensive)', () => {
      expect(Slice.split('00:00:05')).to.eql({ start: '', end: '' });
      expect(Slice.split('weird')).to.eql({ start: '', end: '' });
    });

    it('abs..abs', () => {
      expect(Slice.split('00:00:05..00:00:10')).to.eql({
        start: '00:00:05',
        end: '00:00:10',
      });
    });

    it('open start', () => {
      expect(Slice.split('..00:01:00')).to.eql({ start: '', end: '00:01:00' });
    });

    it('open end', () => {
      expect(Slice.split('00:00:30..')).to.eql({ start: '00:00:30', end: '' });
    });

    it('relative from end (end bound)', () => {
      expect(Slice.split('00:00:05..-00:00:02')).to.eql({
        start: '00:00:05',
        end: '-00:00:02',
      });
    });

    it('relative from end (start bound)', () => {
      expect(Slice.split('-00:00:05..')).to.eql({
        start: '-00:00:05',
        end: '',
      });
    });

    it('trims surrounding whitespace safely', () => {
      expect(Slice.split('  00:00:05  ..  00:00:06  ')).to.eql({
        start: '00:00:05',
        end: '00:00:06',
      });
    });

    it('accepts a parsed TimecodeSlice object', () => {
      const parsed = Slice.parse('00:00:05..-00:00:02' as t.TimecodeSliceString);
      expect(Slice.split(parsed)).to.eql({
        start: '00:00:05',
        end: '-00:00:02',
      });
    });

    it('round-trips with toString() for presentational parts', () => {
      const raw = '..00:00:10' as t.TimecodeSliceString;
      const p = Slice.parse(raw);
      const canon = Slice.toString(p);
      expect(Slice.split(canon)).to.eql({ start: '', end: '00:00:10' });
    });
  });

  describe('duration()', () => {
    const ms = (n: number) => n as t.Msecs;

    it('absolute bounds (no total)', () => {
      const out = Slice.duration('00:00:05..00:00:10');
      expect(out?.ms).to.eql(5_000);
      expect(out?.text).to.eql('5s');
    });

    it('open start requires total (undefined without total)', () => {
      const out = Slice.duration('..00:00:10');
      expect(out).to.eql(undefined);
    });

    it('open start with total', () => {
      const out = Slice.duration('..00:00:10', { total: ms(60_000) });
      expect(out?.ms).to.eql(10_000);
      expect(out?.text).to.eql('10s');
    });

    it('relative end requires total (undefined without total)', () => {
      const out = Slice.duration('00:00:05..-00:00:02');
      expect(out).to.eql(undefined);
    });

    it('relative end with total', () => {
      // total = 15s → window [5s .. 13s] = 8s
      const out = Slice.duration('00:00:05..-00:00:02', { total: ms(15_000) });
      expect(out?.ms).to.eql(8_000);
      expect(out?.text).to.eql('8s');
    });

    it('unit override: explicit ms', () => {
      const out = Slice.duration('00:00:05..-00:00:02', {
        total: ms(15_000),
        unit: 'ms',
      });
      expect(out?.ms).to.eql(8_000);
      expect(out?.text).to.eql('8000ms');
    });

    it('unit override with rounding (seconds)', () => {
      const out = Slice.duration('00:00:00..00:00:01.500', { unit: 's', round: 1 });
      expect(out?.ms).to.eql(1_500);
      expect(out?.text).to.eql('1.5s');
    });

    it('coerces swapped absolute bounds', () => {
      const out = Slice.duration('00:00:10..00:00:05');
      expect(out?.ms).to.eql(5_000);
      expect(out?.text).to.eql('5s');
    });

    it('clamps when relEnd pushes start < 0; full-range duration', () => {
      // Slice "-5m.." on a 2m total clamps to [0 .. 2m] = 2m
      const out = Slice.duration('-00:05:00..', { total: ms(120_000) });
      expect(out?.ms).to.eql(120_000);
      expect(out?.text).to.eql('2m');
    });

    it('zero duration', () => {
      const out = Slice.duration('00:00:05..00:00:05');
      expect(out?.ms).to.eql(0);
      expect(out?.text).to.eql('0ms');
    });

    it('respects default formatter rounding via opts.round', () => {
      const out = Slice.duration('00:00:00..00:00:01.234', { round: 2 });
      expect(out?.ms).to.eql(1_234);
      // Default formatter auto-picks seconds for >= 1000ms.
      expect(out?.text).to.eql('1.23s', out?.text);
    });

    it('abs..relEnd long-form with total=30m → 8m30s (510000ms)', () => {
      const d = Slice.duration('00:11:30..-00:10:00', { total: ms(30 * 60 * 1000), unit: 'ms' })!;
      expect(d.ms).to.eql(510_000);
      expect(d.text).to.eql('510000ms');
    });
  });

  describe('toRange() (→ MsecSpan)', () => {
    it('undefined input → undefined', () => {
      const out = Slice.toRange(undefined, secs(10));
      expect(out).to.eql(undefined);
    });

    it('invalid lexical slice → undefined', () => {
      const out = Slice.toRange('not-a-slice', secs(10));
      expect(out).to.eql(undefined);
    });

    it('requires total (no-total returns undefined)', () => {
      const out = Slice.toRange('00:00:01..00:00:02');
      expect(out).to.eql(undefined);
    });

    it('open start ("..00:00:10")', () => {
      const out = Slice.toRange('..00:00:10', secs(20))!;
      expect(out).to.eql({ from: ms(0), to: ms(10_000) });
    });

    it('open end ("00:00:10..")', () => {
      const out = Slice.toRange('00:00:10..', secs(20))!;
      expect(out).to.eql({ from: ms(10_000), to: ms(20_000) });
    });

    it('relative end ("00:00:05..-00:00:02")', () => {
      const out = Slice.toRange('00:00:05..-00:00:02', secs(10))!;
      expect(out).to.eql({ from: ms(5_000), to: ms(8_000) });
    });

    it('full window ("..") resolves to [0,total]', () => {
      const out = Slice.toRange('..', secs(12))!;
      expect(out).to.eql({ from: ms(0), to: ms(12_000) });
    });

    it('absolute reversed coerced to ascending (min..max)', () => {
      const out = Slice.toRange('00:00:12..00:00:01', secs(20))!;
      expect(out).to.eql({ from: ms(1_000), to: ms(12_000) });
    });

    it('clamps to total (end beyond total)', () => {
      const out = Slice.toRange('00:00:00..00:00:25', secs(20))!;
      expect(out).to.eql({ from: ms(0), to: ms(20_000) });
    });

    it('total with fractional seconds is floored to ms', () => {
      const out = Slice.toRange('..00:00:20', secs(10.9))!;
      expect(out).to.eql({ from: ms(0), to: ms(10_900) });
    });

    it('abs..relEnd long-form ("00:11:30..-00:10:00")', () => {
      const out = Slice.toRange('00:11:30..-00:10:00', secs(30 * 60))!;
      expect(out).to.eql({ from: ms(690_000), to: ms(1_200_000) });
    });

    it('tolerates surrounding whitespace in slice input', () => {
      const out = Slice.toRange('  00:00:10  ..  -00:00:20  ', secs(100))!;
      expect(out).to.eql({ from: ms(10_000), to: ms(80_000) }); // 10s → (100s - 20s) = 80s
    });
  });
});
