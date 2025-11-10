import { type t, describe, expect, expectTypeOf, it } from '../../-test.ts';
import { cmp } from '../core/u.sort.ts';
import { Timecode } from '../mod.ts';

describe('Timecode (core)', () => {
  describe('type guards', () => {
    it('type guard: narrows inside branch (structural smoke)', () => {
      const value: unknown = '03:25.000';
      if (Timecode.is(value)) {
        const ms = Timecode.parse(value); // value is now a timecode string; parseMs should accept it
        expect(ms).to.eql((3 * 60 + 25) * 1000);
      } else {
        expect(false).to.eql(true); // should not happen in this test
      }
    });

    it('kindOf(): lexical classification', () => {
      expect(Timecode.kindOf('12:34')).to.eql('MM:SS');
      expect(Timecode.kindOf('00:12:34')).to.eql('HH:MM:SS');
      expect(Timecode.kindOf('00:12:34.567')).to.eql('HH:MM:SS.mmm');
    });
  });

  describe('is', () => {
    it('is(): valid forms', () => {
      const valids = [
        '00:00',
        '12:34',
        '00:00:00',
        '12:34:56',
        '00:00:00.000',
        '12:34:56.789',
        '59:59',
        '00:59:59',
        '00:59:59.999',
      ];
      for (const s of valids) expect(Timecode.is(s)).to.eql(true, s);
    });

    it('is(): invalid forms', () => {
      const invalids = [
        '',
        '0:00',
        '3:25', //          single-digit mins
        '60:00',
        '59:60', //         out-of-range mm/ss in MM:SS
        '00:60:00',
        '00:00:60', //      out-of-range ss in HH:MM:SS
        '00:00:00,000',
        '00:00.00',
        '00:00:00.00',
        '00:00:00.0000', // wrong millis
        '123:00:00', //     hours must be two digits
        '00:0a',
        'aa:bb',
        '::',
        'abc',
      ];
      for (const s of invalids) expect(Timecode.is(s)).to.eql(false, s);
    });
  });

  describe('parse', () => {
    it('parseMs(): MM:SS', () => {
      const cases: Record<string, number> = {
        '00:00': 0,
        '00:01': 1000,
        '01:00': 60_000,
        '03:25': (3 * 60 + 25) * 1000,
        '59:59': (59 * 60 + 59) * 1000,
      };
      for (const [s, ms] of Object.entries(cases)) {
        expect(Timecode.is(s)).to.eql(true, s);
        expect(Timecode.parse(s)).to.eql(ms, s);
      }
    });

    it('parseMs(): HH:MM:SS(.mmm)', () => {
      const cases: Record<string, number> = {
        '00:00:00': 0,
        '00:00:01': 1000,
        '00:01:00': 60_000,
        '01:00:00': 3_600_000,
        '01:02:03': (1 * 3600 + 2 * 60 + 3) * 1000,
        '01:02:03.004': (1 * 3600 + 2 * 60 + 3) * 1000 + 4,
        '00:03:25.250': (3 * 60 + 25) * 1000 + 250,
        '12:34:56.789': (12 * 3600 + 34 * 60 + 56) * 1000 + 789,
      };
      for (const [s, ms] of Object.entries(cases)) {
        expect(Timecode.is(s)).to.eql(true, s);
        expect(Timecode.parse(s)).to.eql(ms, s);
      }
    });
  });

  describe('format', () => {
    it('format(): minimal vs forceHours/millis', () => {
      // minimal (no hours, no millis)
      expect(Timecode.format(0)).to.eql('00:00');
      expect(Timecode.format(65_000)).to.eql('01:05');

      // with millis
      expect(Timecode.format(500, { withMillis: true })).to.eql('00:00.500');
      expect(Timecode.format(65_123, { withMillis: true })).to.eql('01:05.123');

      // force hours
      expect(Timecode.format(65_000, { withMillis: false, forceHours: true })).to.eql('00:01:05');
      expect(Timecode.format(3_600_000, { withMillis: false, forceHours: true })).to.eql(
        '01:00:00',
      );

      // hours + millis
      expect(Timecode.format(3_600_004, { withMillis: true, forceHours: true })).to.eql(
        '01:00:00.004',
      );

      // round-trip sanity (format → is)
      const out = Timecode.format(3723_456, { withMillis: true }); // 01:02:03.456
      expect(Timecode.is(out)).to.eql(true);
    });
  });

  describe('sort', () => {
    it('cmp(): ordering by time', () => {
      const a = '00:59';
      const b = '01:00';
      const c = '01:00:00';
      expect(cmp(a, b)).to.be.lessThan(0);
      expect(cmp(b, a)).to.be.greaterThan(0);
      expect(cmp(c, c)).to.eql(0);
    });

    it('sort(): valid first by time; invalids stable at end', () => {
      const input = ['xx', '03:00', 'bad', '00:10', '00:10.500', '03:00.001'];
      const out = Timecode.sort(input);
      // valid ascending
      expect(out.slice(0, 4)).to.eql(['00:10', '00:10.500', '03:00', '03:00.001']);
      // invalids in original relative order
      expect(out.slice(4)).to.eql(['xx', 'bad']);
    });
  });

  describe('Timecode.toEntries', () => {
    it('API: exists and has the right type', () => {
      expect(typeof Timecode.toEntries).to.eql('function');
      expectTypeOf(Timecode.toEntries).toEqualTypeOf<
        <T>(bag: Readonly<Record<string, T>>) => readonly t.TimecodeEntry<T>[]
      >();
    });

    it('empty bag → empty list', () => {
      const out = Timecode.toEntries({});
      expect(out).to.eql([]);
    });

    it('filters invalid keys and sorts valid ascending by time', () => {
      const bag = {
        xx: 'bad',
        '3:25': 'bad', // invalid (single-digit minutes)
        '00:00': 'a',
        '00:59': 'b',
        '01:00': 'c',
        '00:00:01.250': 'd',
        '00:00:01': 'e',
        '00:00:01.100': 'f',
        '12:34:56.789': 'g',
      } as const;

      const out = Timecode.toEntries(bag);
      const seq = out.map((e) => e.tc);

      expect(seq).to.eql([
        '00:00',
        '00:00:01',
        '00:00:01.100',
        '00:00:01.250',
        '00:59',
        '01:00',
        '12:34:56.789',
      ]);

      // Data preserved
      expect(out.map((e) => e.data)).to.eql(['a', 'e', 'f', 'd', 'b', 'c', 'g']);
    });

    it('typing: tc is VttTimecode; ms is Msecs; data is generic T', () => {
      const bag: Readonly<Record<string, { fn: () => number }>> = {
        '00:00': { fn: () => 1 },
        '00:00:00.500': { fn: () => 2 },
        bad: { fn: () => 999 },
      };

      const out = Timecode.toEntries(bag);
      expect(out.length).to.eql(2);

      // compile-time surface
      const first = out[0];
      expectTypeOf(first.tc).toEqualTypeOf<t.VttTimecode>();
      expectTypeOf(first.ms).toEqualTypeOf<t.Msecs>();
      expectTypeOf(first.data.fn).toEqualTypeOf<() => number>();

      // runtime sanity
      expect(first.data.fn()).to.eql(1);
      expect(out[1].data.fn()).to.eql(2);
      expect(out[0].ms).to.be.lessThan(out[1].ms);
    });

    it('invalid keys are excluded entirely', () => {
      const bag = { bad: 1, 'also-bad': 2 } as const;
      const out = Timecode.toEntries(bag);
      expect(out).to.eql([]);
    });
  });
});
