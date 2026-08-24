import { describe, expect, it } from '../../-test.ts';
import { Percent } from '../m.Percent/mod.ts';
import { Ratio } from '../m.Ratio.ts';
import { Num } from '../mod.ts';

describe('Value.Num', () => {
  it('API', () => {
    expect(typeof Num.Is.finite).to.equal('function');
    expect(typeof Num.Is.int).to.equal('function');
    expect(typeof Num.Is.safeInt).to.equal('function');
    expect(Num.Percent).to.equal(Percent);
    expect(Num.Percent.Is).to.equal(Percent.Is);
    expect(Num.Percent.Range).to.equal(Percent.Range);
    expect(Num.Ratio).to.equal(Ratio);
  });

  describe('Num.Is', () => {
    const predicateInputs: readonly unknown[] = [
      Num.MIN_INT - 1,
      Num.MIN_INT,
      -12,
      -1.5,
      0,
      1.5,
      12,
      Num.MAX_INT,
      Num.MAX_INT + 1,
      NaN,
      Number.NEGATIVE_INFINITY,
      Number.POSITIVE_INFINITY,
      '1',
      1n,
      {},
      null,
      undefined,
    ];

    it('finite', () => {
      expect(Num.Is.finite(0)).to.eql(true);
      expect(Num.Is.finite(1.5)).to.eql(true);
      expect(Num.Is.finite(NaN)).to.eql(false);
      expect(Num.Is.finite(Number.POSITIVE_INFINITY)).to.eql(false);
      expect(Num.Is.finite('1')).to.eql(false);
    });

    it('int corresponds to Number.isInteger', () => {
      for (const input of predicateInputs) {
        expect(Num.Is.int(input)).to.equal(Number.isInteger(input));
      }
    });

    it('safeInt corresponds to Number.isSafeInteger', () => {
      for (const input of predicateInputs) {
        expect(Num.Is.safeInt(input)).to.equal(Number.isSafeInteger(input));
      }
    });
  });

  describe('Num.round', () => {
    it('should round to no decimal places by default', () => {
      expect(Num.round(1.2345)).to.eql(1);
      expect(Num.round(1.5)).to.eql(2);
      expect(Num.round(1.4)).to.eql(1);
    });

    it('should round to the specified number of decimal places', () => {
      expect(Num.round(1.2345, 2)).to.eql(1.23);
      expect(Num.round(1.235, 2)).to.eql(1.24);
      expect(Num.round(1.2345, 3)).to.eql(1.235);
    });

    it('should handle negative precision correctly', () => {
      expect(Num.round(12345, -1)).to.eql(12350);
      expect(Num.round(12345, -2)).to.eql(12300);
    });

    it('should round negative numbers correctly', () => {
      expect(Num.round(-1.2345)).to.eql(-1);
      expect(Num.round(-1.5)).to.eql(-1);
      expect(Num.round(-1.51)).to.eql(-2);
      expect(Num.round(-1.4)).to.eql(-1);
      expect(Num.round(-1.2345, 2)).to.eql(-1.23);
    });

    it('should round zero correctly', () => {
      expect(Num.round(0)).to.eql(0);
      expect(Num.round(0.1234, 2)).to.eql(0.12);
      expect(Num.round(0, -1)).to.eql(0);
    });
  });

  describe('Num.toString', () => {
    const format = (value = 0, maxDecimals = 2) => {
      return new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: maxDecimals,
      }).format(value);
    };

    const expectDisplay = (value?: number, maxDecimals?: number) => {
      expect(Num.toString(value, maxDecimals)).to.eql(format(value, maxDecimals));
    };

    it('defaults omitted and explicit undefined arguments', () => {
      expect(Num.toString()).to.eql(format());
      expect(Num.toString(undefined, undefined)).to.eql(format(undefined, undefined));
    });

    it('forwards the host-default locale and documented Intl options', () => {
      const descriptor = Object.getOwnPropertyDescriptor(
        Intl,
        'NumberFormat',
      ) as PropertyDescriptor;
      const calls: {
        readonly locales: unknown;
        readonly options: Intl.NumberFormatOptions | undefined;
      }[] = [];
      let outputs: readonly string[] = [];

      try {
        Object.defineProperty(Intl, 'NumberFormat', {
          ...descriptor,
          value: class {
            constructor(locales?: unknown, options?: Intl.NumberFormatOptions) {
              calls.push({ locales, options });
            }

            format(value: number) {
              return `formatted:${value}`;
            }
          },
        });
        outputs = [Num.toString(), Num.toString(1.234, 3)];
      } finally {
        Object.defineProperty(Intl, 'NumberFormat', descriptor);
      }

      expect(outputs).to.eql(['formatted:0', 'formatted:1.234']);
      expect(calls).to.eql([
        {
          locales: undefined,
          options: { minimumFractionDigits: 0, maximumFractionDigits: 2 },
        },
        {
          locales: undefined,
          options: { minimumFractionDigits: 0, maximumFractionDigits: 3 },
        },
      ]);
    });

    it('matches host-default Intl formatting for integer, fraction, and negative values', () => {
      for (const value of [0, 123, -456, 1.2, 1.234, 123_456.12345, -1.234]) {
        expectDisplay(value);
      }
    });

    it('uses maximumFractionDigits without forcing trailing zeros', () => {
      const cases = [
        [1.2345, 3],
        [1.2345, 1],
        [1.5, 2],
        [2, 3],
        [1.5, 0],
      ];

      for (const [value, maxDecimals] of cases) {
        expectDisplay(value, maxDecimals);
      }
    });

    it('preserves native maximumFractionDigits coercion and supported bounds', () => {
      for (const maxDecimals of [1.5, 100]) {
        expectDisplay(1.2345, maxDecimals);
      }
    });

    it('preserves native maximumFractionDigits range errors', () => {
      for (const maxDecimals of [Number.NaN, -1, 101, Number.POSITIVE_INFINITY]) {
        expect(() => format(1.2345, maxDecimals)).to.throw(RangeError);
        expect(() => Num.toString(1.2345, maxDecimals)).to.throw(RangeError);
      }
    });
  });

  describe('Num.clamp', () => {
    it('clamps values below the minimum to the minimum', () => {
      expect(Num.clamp(0, 1, -5)).to.eql(0);
    });

    it('clamps values above the maximum to the maximum', () => {
      expect(Num.clamp(0, 1, 2)).to.eql(1);
    });

    it('returns the original value when within the range', () => {
      expect(Num.clamp(0, 1, 0.5)).to.eql(0.5);
    });

    it('returns the minimum when equal to the minimum bound', () => {
      expect(Num.clamp(0, 1, 0)).to.eql(0);
    });

    it('returns the maximum when equal to the maximum bound', () => {
      expect(Num.clamp(0, 1, 1)).to.eql(1);
    });

    it('handles negative ranges', () => {
      expect(Num.clamp(-1, 1, -2)).to.eql(-1);
      expect(Num.clamp(-1, 1, 2)).to.eql(1);
      expect(Num.clamp(-1, 1, 0)).to.eql(0);
    });

    it('returns NaN if the value is NaN', () => {
      const result = Num.clamp(0, 1, NaN);
      expect(Number.isNaN(result)).to.be.true;
    });
  });

  describe('Num.toLetter', () => {
    // prettier-ignore
    const ALPHABET = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'] as const

    it('returns uppercase letters A-Z for 0-25', () => {
      const results = Array.from({ length: 26 }, (_, i) => Num.toLetter(i));
      expect(results).to.eql(ALPHABET);
    });

    it('wraps around after Z (mod 26)', () => {
      expect(Num.toLetter(26)).to.eql('A');
      expect(Num.toLetter(27)).to.eql('B');
      expect(Num.toLetter(51)).to.eql('Z');
    });

    it('handles large indexes consistently (e.g., modulo wrap)', () => {
      expect(Num.toLetter(52)).to.eql('A'); // 26×2
      expect(Num.toLetter(78)).to.eql('A'); // 26×3
      expect(Num.toLetter(79)).to.eql('B');
    });

    it('handles negative numbers by modular equivalence', () => {
      expect(Num.toLetter(-1)).to.eql('Z');
      expect(Num.toLetter(-2)).to.eql('Y');
      expect(Num.toLetter(-27)).to.eql('Z');
    });

    it('coerces non-integer values via truncation (consistent with modulo)', () => {
      expect(Num.toLetter(0.9)).to.eql('A');
      expect(Num.toLetter(25.9)).to.eql('Z');
      expect(Num.toLetter(26.1)).to.eql('A');
    });
  });

  describe('Num.sum', () => {
    it('returns 0 for an empty array', () => {
      const res = Num.sum([]);
      expect(res).to.equal(0);
    });

    it('sums a single value', () => {
      const res = Num.sum([7]);
      expect(res).to.equal(7);
    });

    it('sums multiple values', () => {
      const res = Num.sum([1, 2, 3, 4]);
      expect(res).to.equal(10);
    });

    it('handles negative numbers', () => {
      const res = Num.sum([5, -2, -3]);
      expect(res).to.equal(0);
    });

    it('handles floating point values', () => {
      const res = Num.sum([0.25, 0.25, 0.5]);
      expect(res).to.equal(1);
    });
  });

  describe('Num constants', () => {
    it('MAX_INT equals Number.MAX_SAFE_INTEGER', () => {
      expect(Num.MAX_INT).to.equal(Number.MAX_SAFE_INTEGER);
    });

    it('MIN_INT equals Number.MIN_SAFE_INTEGER', () => {
      expect(Num.MIN_INT).to.equal(Number.MIN_SAFE_INTEGER);
    });

    it('INFINITY equals Number.POSITIVE_INFINITY', () => {
      expect(Num.INFINITY).to.equal(Number.POSITIVE_INFINITY);
    });

    it('constants are readonly numbers', () => {
      expect(typeof Num.MAX_INT).to.equal('number');
      expect(typeof Num.MIN_INT).to.equal('number');
      expect(typeof Num.INFINITY).to.equal('number');
    });
  });
});
