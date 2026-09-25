import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Time } from '../mod.ts';

const FORMAT = 'yyyy-MM-dd HH:mm:ss.SSS';
const DATE_LIMIT = 8_640_000_000_000_000;

describe('Time.utc', () => {
  describe('input meaning', () => {
    it('omitted input → current instant, not epoch zero', () => {
      const before = Date.now();
      const implicit = Time.utc();
      const explicit = Time.utc(undefined);
      const after = Date.now();
      expect(implicit.timestamp).to.be.within(before, after);
      expect(explicit.timestamp).to.be.within(before, after);
      expectTypeOf(implicit).toEqualTypeOf<t.DateTime>();
    });

    it('negative zero → epoch zero', () => {
      expect(Time.utc(-0).timestamp).to.eql(0);
    });

    const timestamps = [
      0,
      -1,
      1,
      -1.9,
      1.9,
      20_200_102,
      1_700_000_000_123,
      -DATE_LIMIT,
      DATE_LIMIT,
    ];
    for (const timestamp of timestamps) {
      it(`number ${timestamp} → Unix milliseconds with native Date clipping`, () => {
        const value = Time.utc(timestamp);
        const expected = new Date(timestamp);
        expect(value.timestamp).to.eql(expected.getTime());
        expect(value.date).to.eql(expected);
      });
    }

    it('date-shaped number and ISO basic-date string retain distinct meanings', () => {
      expect(Time.utc(20200102).timestamp).to.eql(20200102);
      expect(Time.utc('20200102').timestamp).to.eql(new Date(2020, 0, 2).getTime());
    });

    const inputs = [
      ['2025-01-01T12:30:45.123Z', Date.UTC(2025, 0, 1, 12, 30, 45, 123)],
      ['2025-01-02T01:30:45.123+13:00', Date.UTC(2025, 0, 1, 12, 30, 45, 123)],
      ['2025-01-01', new Date(2025, 0, 1).getTime()],
      ['2025-01-01T12:30:45', new Date(2025, 0, 1, 12, 30, 45).getTime()],
    ] as const;
    for (const [input, timestamp] of inputs) {
      it(`ISO string ${input} → resolves its stated offset or local time`, () => {
        expect(Time.utc(input).timestamp).to.eql(timestamp);
      });
    }
  });

  describe('Date mutation isolation', () => {
    it('input mutation cannot change the stored instant or its formatting', () => {
      const input = new Date('2025-01-01T12:30:45.123Z');
      const timestamp = input.getTime();
      const expected = Time.Date.format(input, FORMAT);
      const value = Time.utc(input);
      expect(value.date).not.to.equal(input);
      input.setTime(0);
      expect(value.timestamp).to.eql(timestamp);
      expect(value.format(FORMAT)).to.eql(expected);
    });

    it('each output is a fresh Date; mutation cannot change future reads', () => {
      const value = Time.utc('2025-01-01T12:30:45.123Z');
      const timestamp = value.timestamp;
      const first = value.date;
      const second = value.date;
      expect(first).not.to.equal(second);
      expect(first).to.eql(second);
      first.setTime(NaN);
      second.setTime(0);
      expect(value.timestamp).to.eql(timestamp);
      expect(value.date.getTime()).to.eql(timestamp);
      expect(value.format(FORMAT)).to.eql(Time.Date.format(new Date(timestamp), FORMAT));
    });
  });

  describe('invalid instances remain inspectable', () => {
    const invalid: readonly [string, t.DateTimeInput][] = [
      ['empty string', ''],
      ['whitespace', ' '],
      ['unparseable string', 'not a date'],
      ['impossible ISO date', '2025-02-30'],
      ['NaN', NaN],
      ['positive infinity', Infinity],
      ['negative infinity', -Infinity],
      ['above Date range', DATE_LIMIT + 1],
      ['below Date range', -DATE_LIMIT - 1],
      ['invalid Date', new Date(NaN)],
    ];
    for (const [label, input] of invalid) {
      it(`${label} → NaN timestamp and stable formatting failure`, () => {
        const value = Time.utc(input); // Construction must not throw.
        expect(value.timestamp).to.be.NaN;
        expect(value.date.getTime()).to.be.NaN;
        expect(value.date).not.to.equal(value.date);
        for (const template of [undefined, FORMAT, 'invalid-template']) {
          expect(() => value.format(template)).to.throw(RangeError, /^Time\.utc: invalid date$/);
        }
      });
    }

    it('repairing input or output Dates does not repair the invalid snapshot', () => {
      const input = new Date(NaN);
      const value = Time.utc(input);
      input.setTime(0);
      value.date.setTime(0);
      expect(value.timestamp).to.be.NaN;
      expect(value.date.getTime()).to.be.NaN;
    });
  });

  describe('local-zone formatting', () => {
    for (const iso of ['2025-01-01T12:30:45.123Z', '2025-07-01T12:30:45.123Z']) {
      it(`${iso} → native local fields and Time.Date formatter parity`, () => {
        const input = new Date(iso);
        const value = Time.utc(input);
        expect(value.format()).to.eql(Time.Date.format(input, 'yyyy-MM-dd'));
        expect(value.format(FORMAT)).to.eql(Time.Date.format(input, FORMAT));
        expect(value.format('H')).to.eql(String(input.getHours()));
        expect(value.format('d')).to.eql(String(input.getDate()));
        expect(value.timestamp).to.eql(input.getTime());
      });
    }

    it('valid dates retain formatter template errors rather than relabeling them as invalid dates', () => {
      const value = Time.utc(new Date(0));
      const message = /unescaped latin alphabet character/;
      expect(() => value.format('n')).to.throw(RangeError, message);
      expect(() => Time.Date.format(new Date(0), 'n')).to.throw(RangeError, message);
    });
  });
});

describe('Time.now', () => {
  it('returns a fresh, independent snapshot of the current time', () => {
    const before = Date.now();
    const value = Time.now;
    const after = Date.now();
    const timestamp = value.timestamp;
    expect(timestamp).to.be.within(before, after);
    expect(value.date.getTime()).to.eql(timestamp);
    value.date.setTime(0);
    expect(value.timestamp).to.eql(timestamp);
    expect(value.date.getTime()).to.eql(timestamp);
    expect(Time.now).not.to.equal(value);
  });

  it('uses the same local-zone formatter and default template', () => {
    const value = Time.now;
    expect(value.format()).to.eql(Time.Date.format(value.date, 'yyyy-MM-dd'));
    expect(value.format(FORMAT)).to.eql(Time.Date.format(value.date, FORMAT));
  });
});
