import { describe, expect, expectTypeOf, it, type t } from '../../../-test.ts';
import { wallClock } from '../../-test/u.fixture.wallClock.ts';
import { Time } from '../../mod.ts';
import { Duration } from '../mod.ts';

const { SECOND, MINUTE, HOUR, DAY } = Time.Date;

describe('Duration', () => {
  describe('Time.duration', () => {
    it('time.duration(...)', () => {
      const a = Time.duration(123);
      const b = Time.duration('3.5h');
      expect(a.msec).to.eql(123);
      expect(b.hour).to.eql(3.5);
    });

    it('toString()', () => {
      const res = Time.duration(1025);
      expect(res.msec).to.eql(1025);
      expect(res.toString()).to.eql('1s');
      expect(res.format('ms')).to.eql('1025ms');
    });

    it('format (round)', () => {
      const res1 = Time.duration(1258).format();
      const res2 = Time.duration(1258).format({ round: 1 });
      const res3 = Time.duration(1258).format({ round: 3 });
      const res4 = Time.duration(300.234).format('ms');
      const res5 = Time.duration(300.234).format({ unit: 'ms', round: 1 });

      expect(res1).to.eql('1s');
      expect(res2).to.eql('1.3s');
      expect(res3).to.eql('1.258s');
      expect(res4).to.eql('300ms');
      expect(res5).to.eql('300.2ms');
    });

    it('ok: true', () => {
      expect(Time.duration(123).ok).to.eql(true);
      expect(Time.duration(0).ok).to.eql(true);
    });

    it('ok: false', () => {
      expect(Time.duration(-1).ok).to.eql(false);
      expect(Time.duration(-0.001).ok).to.eql(false);
    });
  });

  it('compatibility aliases retain the same owner', () => {
    expect(Time.Duration).to.equal(Duration);
    expect(Time.duration).to.equal(Duration.create);
    expect(Time.elapsed).to.equal(Duration.elapsed);
  });

  it('amount and instant type names preserve existing call shapes', () => {
    const amount: t.Time.Duration.AmountInput = '03s';
    const start: t.Time.Duration.InstantInput = '1970-01-01T00:00:00.000Z';
    const duration = Time.duration(amount);
    const elapsed = Time.elapsed(start, 3000);
    expectTypeOf<t.Time.Duration.Input>(amount).toEqualTypeOf<t.Time.Duration.AmountInput>();
    expectTypeOf(duration).toEqualTypeOf<t.Time.Duration.Instance>();
    expectTypeOf(elapsed).toEqualTypeOf<t.Time.Duration.Instance>();
    expect(duration.msec).to.eql(3000);
    expect(elapsed.msec).to.eql(3000);
  });

  describe('Duration.To', () => {
    // Unit aliases are numbers; runtime values prove conversion, not nominal type separation.
    const cases = [
      ['sec', 1250],
      ['min', 75_000],
      ['hour', 4_500_000],
      ['day', 108_000_000],
    ] as const;
    for (const [unit, msecs] of cases) {
      it(`${unit} → converts milliseconds with the requested precision`, () => {
        expect(Duration.To[unit](msecs)).to.eql(1);
        expect(Duration.To[unit](msecs, 2)).to.eql(1.25);
      });
    }
  });

  describe('decimal amount grammar', () => {
    const cases = [
      ['0', 0],
      ['  0   ', 0],
      ['007', 7],
      ['03s', 3000],
      ['3.0s', 3000],
      ['1.50s', 1500],
      ['2.50h', 9_000_000],
      ['.5s', 500],
      ['.05s', 50],
      ['000.050s', 50],
      ['12.', 12],
      ['12.s', 12_000],
      ['.0', 0],
      ['00.00ms', 0],
      ['123ms', 123],
      ['123 ms', 123],
      ['123.5ms  ', 123.5],
      ['3.5s', 3500],
      ['\t 1.5\n sec \r\n', 1500],
      ['1\u00a0hour', HOUR],
    ] as const;
    for (const [input, expected] of cases) {
      it(`${JSON.stringify(input)} → ${expected} ms`, () => {
        for (const create of [Duration.create, Duration.parse]) {
          const res = create(input);
          expect(res.ok).to.eql(true);
          expect(res.msec).to.eql(expected);
        }
      });
    }

    const units = [
      ['', 1],
      ['ms', 1],
      ['msec', 1],
      ['s', SECOND],
      ['sec', SECOND],
      ['m', MINUTE],
      ['min', MINUTE],
      ['h', HOUR],
      ['hour', HOUR],
      ['d', DAY],
      ['day', DAY],
    ] as const;
    for (const [unit, multiplier] of units) {
      it(`unit ${unit || '(omitted)'} → case-insensitive with optional whitespace`, () => {
        for (const suffix of [unit, ` ${unit}`, `\t${unit.toUpperCase()} `]) {
          for (const create of [Duration.create, Duration.parse]) {
            const res = create(`01.50${suffix}`);
            expect(res.ok).to.eql(true);
            expect(res.msec).to.eql(1.5 * multiplier);
          }
        }
      });
    }

    const invalid = [
      '',
      ' ',
      '.',
      '.s',
      'ms',
      '-1',
      '-10s',
      '-0',
      '-0s',
      '+1s',
      '+0',
      '−1s',
      '1e3',
      '1E3s',
      '1e-3s',
      '0x10',
      '0b10',
      '1_000ms',
      '1,000s',
      '1,5s',
      '123. 5ms',
      '123 .5ms',
      '123 .5',
      '1 2s',
      '1\n2s',
      '1..5s',
      '1.5.0s',
      '..5s',
      '1ss',
      '1seconds',
      '1minute',
      '1hours',
      '1days',
      '1mse',
      '1se',
      '1mi',
      '1ho',
      '1da',
      '1msecx',
      '1 s ec',
      '1s2',
      '1h 30m',
      's1',
      'NaN',
      'NaNs',
      'Infinity',
      'Infinitys',
      '-Infinity',
      '1970-01-01T00:00:00.000Z',
      'P1D',
      '１s',
      '1s\nignored',
      '1s\u0000',
    ];
    for (const input of invalid) {
      it(`${JSON.stringify(input)} → invalid in full, not a usable prefix`, () => {
        for (const create of [Duration.create, Duration.parse]) expectInvalid(create(input));
      });
    }

    it('amount or unit multiplication overflow → invalid', () => {
      const overflow = '9'.repeat(309);
      const large = `1${'0'.repeat(303)}`;
      for (const create of [Duration.create, Duration.parse]) {
        expect(create(large).ok).to.eql(true);
        expectInvalid(create(overflow));
        expectInvalid(create(`${large}day`));
      }
    });
  });

  describe('numeric validity', () => {
    const valid = [0, 123, 123.5, Number.MIN_VALUE, Number.MAX_SAFE_INTEGER + 1, Number.MAX_VALUE];
    for (const input of valid) {
      it(`${input} → valid finite milliseconds without timer-domain clamping`, () => {
        for (const create of [Duration.create, Duration.parse]) {
          const res = create(input);
          expect(res.ok).to.eql(true);
          expect(res.msec).to.eql(input);
        }
      });
    }

    for (const input of [-1, -0.000001, NaN, Infinity, -Infinity]) {
      it(`${input} → all numeric fields are -1 regardless of rounding`, () => {
        for (const create of [Duration.create, Duration.parse]) {
          for (const round of [undefined, 0, 1, 6, -2, NaN, Infinity]) {
            expectInvalid(create(input, { round }));
          }
        }
      });
    }

    it('negative zero → positive zero in every numeric field', () => {
      for (const create of [Duration.create, Duration.parse]) {
        const res = create(-0);
        expect(res.ok).to.eql(true);
        for (const unit of ['msec', 'sec', 'min', 'hour', 'day'] as const) {
          expect(Object.is(res[unit], 0), unit).to.eql(true);
        }
      }
    });

    it('invalid instances retain the existing millisecond sentinel formatting', () => {
      const res = Duration.create(NaN);
      expect(res.format()).to.eql('-1ms');
      expect(res.toString()).to.eql('-1ms');
      expect(res.format('ms')).to.eql('-1ms');
      expect(res.format('s')).to.eql(Duration.format(-1, 's'));
    });

    it('parsed amounts preserve unit rounding and formatting options', () => {
      const res = Duration.parse('01.2345s', { round: 3 });
      expect(res.msec).to.eql(1234.5);
      expect(res.sec).to.eql(1.235);
      expect(res.min).to.eql(0.021);
      expect(res.hour).to.eql(0);
      expect(res.day).to.eql(0);
      expect(res.format()).to.eql('1s');
      expect(res.format({ round: 2 })).to.eql('1.23s');
      expect(res.format({ unit: 'ms', round: 1 })).to.eql('1234.5ms');
    });
  });

  describe('Duration.elapsed', () => {
    it('calculates the gap between two explicit millisecond instants', () => {
      const gap = Duration.elapsed(2_000, 5_000);
      expect(gap.msec).to.equal(3_000);
    });

    it('defaults the end instant to now when omitted', () => {
      using _clock = wallClock(2000);
      expect(Duration.elapsed(500).msec).to.eql(1500);
    });

    it('accepts ISO-8601 date-time strings as inputs', () => {
      const gap = Duration.elapsed('1970-01-01T00:00:00.000Z', '1970-01-01T00:00:02.500Z');
      expect(gap.msec).to.equal(2_500);
    });

    it('numeric strings remain instants, not duration amounts', () => {
      expect(Duration.elapsed('0000', '2.5e3').msec).to.eql(2500);
      expect(Duration.elapsed(-1000, 0).msec).to.eql(1000);
      expect(Duration.elapsed(0, 0).msec).to.eql(0);
      expect(() => Duration.elapsed('1s', '2s')).to.throw('Invalid Time.Duration.Input');
      expect(() => Duration.elapsed('not an instant', 0)).to.throw('Invalid Time.Duration.Input');
    });

    it('reversed, non-finite, and overflowing differences → all numeric fields are -1', () => {
      const cases = [
        [2000, 1000],
        [NaN, 0],
        [0, NaN],
        [0, Infinity],
        [-Infinity, 0],
        [Infinity, Infinity],
        [-Number.MAX_VALUE, Number.MAX_VALUE],
        ['1970-01-01T00:00:02.000Z', '1970-01-01T00:00:01.000Z'],
      ] as const;
      for (const [start, end] of cases) {
        expectInvalid(Duration.elapsed(start, end));
      }
    });

    it('invalid and regressed timer starts share Duration validity', () => {
      using _clock = wallClock(1000);
      expectInvalid(Time.timer(new Date(NaN)).elapsed);
      expectInvalid(Time.timer(new Date(2000)).elapsed);
    });
  });
});

function expectInvalid(res: t.Time.Duration.Instance) {
  expect(res.ok).to.eql(false);
  for (const unit of ['msec', 'sec', 'min', 'hour', 'day'] as const) {
    expect(res[unit], unit).to.eql(-1);
  }
}
