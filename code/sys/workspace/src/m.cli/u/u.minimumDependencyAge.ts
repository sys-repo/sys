import { Err, Is, Num, type t } from '../common.ts';
import { StanddownTime } from '../../m.upgrade/u.standdown.time.ts';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

const DEFAULT = 2 * DAY;
const EXPECTED = 'expected minutes, ISO-8601 duration, RFC3339 date/timestamp, or 0';

/** Workspace age inputs: exact whole-millisecond durations or validated UTC cutoffs. */
export const MinimumDependencyAge = Object.freeze(
  {
    /** CLI-surfaced default: 48 hours. */
    default: DEFAULT as t.Msecs,

    parse(input: unknown, evaluatedAt: t.UnixTimestamp): t.Msecs {
      StanddownTime.evaluatedAt(evaluatedAt);
      const value = wrangle.one(input);
      if (value === undefined) {
        if (input === undefined) return MinimumDependencyAge.default;
        throw Err.std('Option requires a value: --minimum-dependency-age');
      }
      if (value === '') throw Err.std('Option requires a value: --minimum-dependency-age');

      const parsed = wrangle.minutes(value) ?? wrangle.isoDuration(value) ??
        wrangle.cutoff(value, evaluatedAt);
      if (!Num.Is.safeInt(parsed) || parsed < 0) {
        throw Err.std(`Invalid minimum dependency age: ${value} (${EXPECTED})`);
      }
      return parsed as t.Msecs;
    },
  } as const,
);

const wrangle = {
  one(input: unknown): string | undefined {
    if (Is.str(input)) return input.trim();
    if (Is.array<string>(input) && Is.str(input[0])) return input[0].trim();
    return undefined;
  },

  minutes(input: string): t.Msecs | undefined {
    if (!/^\d+(?:\.\d+)?$/.test(input)) return undefined;
    return wrangle.exact([[input, MINUTE]]);
  },

  isoDuration(input: string): t.Msecs | undefined {
    const weeks = /^P(\d+(?:\.\d+)?)W$/i.exec(input);
    if (weeks) return wrangle.exact([[weeks[1], WEEK]]);

    const parts =
      /^P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i
        .exec(input);
    if (!parts) return undefined;

    const hasValue = parts.slice(1).some((part) => part !== undefined);
    if (!hasValue) return undefined;

    return wrangle.exact([[parts[1], DAY], [parts[2], HOUR], [parts[3], MINUTE], [parts[4], 1000]]);
  },

  cutoff(input: string, evaluatedAt: t.UnixTimestamp): t.Msecs | undefined {
    const cutoff = StanddownTime.cutoff(input);
    return cutoff === undefined ? undefined : evaluatedAt - cutoff;
  },

  /** Sum decimal components before testing integrality; never round a binary approximation. */
  exact(parts: readonly (readonly [string | undefined, number])[]): t.Msecs | undefined {
    const components = parts.map(([value = '0', unit]) => {
      const [whole, fraction = ''] = value.split('.');
      return { digits: BigInt(whole + fraction), places: fraction.length, unit: BigInt(unit) };
    });
    const places = Math.max(...components.map((part) => part.places));
    const denominator = 10n ** BigInt(places);
    const total = components.reduce(
      (sum, part) => sum + part.digits * part.unit * 10n ** BigInt(places - part.places),
      0n,
    );
    if (total % denominator !== 0n) return undefined;
    const milliseconds = total / denominator;
    if (milliseconds > BigInt(Num.MAX_INT)) return undefined;
    return Number(milliseconds);
  },
} as const;
