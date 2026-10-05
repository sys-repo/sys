import { describe, expect, expectTypeOf, it, type t } from '../-test.ts';
import { Date as DateTools, Time } from '../-exports/-time.ts';

// A Date subclass makes accidental subtype inference observable to the type checker.
class CustomDate extends Date {
  readonly custom = true;
}

// Compile-only misuse checks: never execute assignments to frozen namespaces or invalid calls.
function rejectedCalls(other: t.Date.Lib) {
  const date = new Date(2025, 0, 2, 13, 4);
  const format = DateTools.Format;
  // @ts-expect-error Formatting has no options parameter.
  format.toString(date, 'yyyy', {});
  // @ts-expect-error The compatibility alias has the same options boundary.
  DateTools.format(date, 'yyyy', { weekStartsOn: 1 });
  // @ts-expect-error Relative labels have no options parameter.
  format.relative(date, date, {});
  // @ts-expect-error Calendar subtraction has no context option.
  format.subDays(date, 1, { in: () => date });
  // @ts-expect-error Only addSuffix is supported.
  format.distance(date, date, { includeSeconds: true });
  // @ts-expect-error Locale extension objects are not part of this contract.
  format.distance(date, date, { locale: { formatDistance: () => 'distance' } });
  // @ts-expect-error Context functions are not part of this contract.
  format.distance(date, date, { in: () => date });
  // @ts-expect-error The supported option is boolean.
  format.distance(date, date, { addSuffix: 'yes' });
  // @ts-expect-error Date inputs do not include arbitrary date-like objects.
  format.toString({ timestamp: 0 }, 'yyyy');
  // @ts-expect-error Subtraction promises Date, not a caller-specific subtype.
  format.subDays(new CustomDate(), 1).custom;
  // @ts-expect-error Calendar helpers require Dates, not timestamp numbers.
  DateTools.Day.ofYear(0);
  // @ts-expect-error Parsing requires both the input and its pattern.
  DateTools.parse('2025');
  // @ts-expect-error Difference units are calendar vocabulary, not duration suffixes.
  DateTools.difference(date, date, { units: ['ms'] });

  // @ts-expect-error Frozen library members are readonly.
  DateTools.format = other.format;
  // @ts-expect-error Frozen library members are readonly.
  DateTools.parse = other.parse;
  // @ts-expect-error Frozen library members are readonly.
  DateTools.difference = other.difference;
  // @ts-expect-error Frozen library members are readonly.
  DateTools.Day.ofYear = other.Day.ofYear;
  // @ts-expect-error Frozen library members are readonly.
  DateTools.Day.ofYearUtc = other.Day.ofYearUtc;
  // @ts-expect-error Frozen library members are readonly.
  DateTools.Is.leapYear = other.Is.leapYear;
  // @ts-expect-error Frozen library members are readonly.
  DateTools.Is.leapYearUtc = other.Is.leapYearUtc;
  // @ts-expect-error Frozen library members are readonly.
  format.toString = other.Format.toString;
  // @ts-expect-error Frozen library members are readonly.
  format.distance = other.Format.distance;
  // @ts-expect-error Frozen library members are readonly.
  format.relative = other.Format.relative;
  // @ts-expect-error Frozen library members are readonly.
  format.subDays = other.Format.subDays;
}
void rejectedCalls;

describe('Date public contracts', () => {
  const date = new Date(2025, 0, 2, 13, 4);
  const pattern = 'yyyy-MM-dd HH:mm';
  const format = DateTools.Format;

  it('aliases and nested libraries retain frozen identity', () => {
    expect(Time.Date).to.equal(DateTools);
    expect(DateTools.format).to.equal(format.toString);
    for (const lib of [DateTools, DateTools.Day, DateTools.Is, format]) {
      expect(Object.isFrozen(lib)).to.eql(true);
    }
    expectTypeOf(DateTools).toEqualTypeOf<t.Date.Lib>();
    expectTypeOf(DateTools.format).toEqualTypeOf<t.Date.Format.Lib['toString']>();
  });

  const inputs = [
    { kind: 'Date', input: date },
    { kind: 'Unix milliseconds', input: date.getTime() },
    { kind: 'ISO string', input: date.toISOString() },
  ];
  for (const { kind, input } of inputs) {
    it(`${kind} → local date labels and calendar subtraction`, () => {
      expect(format.toString(input, pattern)).to.eql('2025-01-02 13:04');
      expect(DateTools.format(input, pattern)).to.eql('2025-01-02 13:04');
      expect(format.distance(input, date)).to.eql('less than a minute');
      expect(format.relative(input, date)).to.eql('today at 1:04 PM');
      const previous = format.subDays(input, 1);
      expect(previous).to.eql(new Date(2025, 0, 1, 13, 4));
      expectTypeOf(previous).toEqualTypeOf<Date>();
    });
  }

  it('retains build-label patterns and quoted literals', () => {
    expect(DateTools.format(date, 'y MMM d, h:mmaaa')).to.eql('2025 Jan 2, 1:04pm');
    expect(DateTools.format(date, 'd MMM y, h:mmaaa')).to.eql('2 Jan 2025, 1:04pm');
    expect(DateTools.format(date, 'd MMM, h:mmaaa')).to.eql('2 Jan, 1:04pm');
    expect(DateTools.format(date, 'h:mmaaa')).to.eql('1:04pm');
    expect(DateTools.format(date, 'E MMM do, yyyy')).to.eql('Thu Jan 2nd, 2025');
    expect(DateTools.format(date, "'Today is' eeee")).to.eql('Today is Thursday');
  });

  it('distance labels can include past or future direction', () => {
    const previous = format.subDays(date, 3);
    expect(format.distance(previous, date)).to.eql('3 days');
    expect(format.distance(previous, date, { addSuffix: false })).to.eql('3 days');
    expect(format.distance(previous, date, { addSuffix: true })).to.eql('3 days ago');
    expect(format.distance(date, previous, { addSuffix: true })).to.eql('in 3 days');
    expect(format.relative(previous, date)).to.eql('last Monday at 1:04 PM');
  });

  it('subtraction preserves local calendar fields without mutating the input', () => {
    // Cross Auckland's spring DST boundary when run under Pacific/Auckland.
    const input = new Date(2025, 8, 28, 12, 34);
    const before = input.getTime();
    const previous = format.subDays(input, 1);
    expect(previous).to.eql(new Date(2025, 8, 27, 12, 34));
    expect(previous).not.to.equal(input);
    previous.setTime(0);
    expect(input.getTime()).to.eql(before);
    expect(format.subDays(input, 0)).not.to.equal(input);
    const custom = format.subDays(new CustomDate(before), 1);
    expectTypeOf(custom).toEqualTypeOf<Date>();
  });

  it('invalid dates and invalid patterns retain their existing failures', () => {
    const invalid = new Date(NaN);
    expect(() => format.toString(invalid, pattern)).to.throw(RangeError);
    expect(() => format.toString(date, 'n')).to.throw(RangeError);
    expect(() => format.toString(date, '')).to.throw(TypeError);
    expect(() => format.distance(invalid, date)).to.throw(RangeError);
    expect(() => format.relative(invalid, date)).to.throw(RangeError);
    expect(format.subDays(invalid, 1).getTime()).to.be.NaN;
  });

  it('calendar parsing, differences, day numbers, years, and constants stay available', () => {
    const parsed = DateTools.parse('2025-01-02 13:04', pattern);
    expectTypeOf(parsed).toEqualTypeOf<Date>();
    expect(parsed).to.eql(date);
    const from = new Date(2024, 0, 2, 13, 4);
    const difference = DateTools.difference(from, date, { units: ['years', 'months'] });
    expect(difference).to.eql({ years: 1, months: 12 });
    expect(DateTools.difference(date, from, { units: ['years'] })).to.eql({ years: 1 });
    expect(DateTools.Day.ofYear(date)).to.eql(2);
    expect(DateTools.Day.ofYearUtc(new Date('2025-01-02T13:04:00Z'))).to.eql(2);
    expect(DateTools.Is.leapYear(2024)).to.eql(true);
    expect(DateTools.Is.leapYear(date)).to.eql(false);
    expect(DateTools.Is.leapYearUtc(new Date('2024-01-01T00:00:00Z'))).to.eql(true);
    expect(DateTools.Is.leapYearUtc(2025)).to.eql(false);
    expect([DateTools.SECOND, DateTools.MINUTE, DateTools.HOUR, DateTools.DAY, DateTools.WEEK])
      .to.eql([1_000, 60_000, 3_600_000, 86_400_000, 604_800_000]);
    expectTypeOf(DateTools.SECOND).toEqualTypeOf<1000>();
  });
});
