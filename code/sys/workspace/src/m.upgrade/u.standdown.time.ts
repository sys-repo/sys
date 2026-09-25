import { Err, Is, Num, type t, Time } from './common.ts';

/** Separate strict publication evidence from the date forms accepted for operator cutoffs. */
export const StanddownTime = {
  maxTimestamp: 8_640_000_000_000_000,

  minimumAge(input: t.Msecs = 0): t.Msecs {
    if (!Num.Is.safeInt(input) || input < 0) {
      throw Err.std(
        `Invalid minimumDependencyAge: ${input} (expected nonnegative safe-integer milliseconds)`,
      );
    }
    return input;
  },

  evaluatedAt(input: t.UnixTimestamp = Time.now.timestamp): t.UnixTimestamp {
    if (!Num.Is.safeInt(input) || input < 0 || input > StanddownTime.maxTimestamp) {
      throw Err.std(`Invalid evaluatedAt timestamp: ${input}`);
    }
    return input;
  },

  /** Registry evidence must include a calendar date, seconds, and an explicit timezone. */
  publication(input: unknown): t.UnixTimestamp | undefined {
    if (!Is.str(input)) return undefined;
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2})$/
      .exec(input);
    return match?.[0] === input ? wrangle.timestamp(input, match) : undefined;
  },

  /** Dates mean UTC midnight; CLI times also accept basic offsets and reduced or decimal precision. */
  cutoff(input: string): t.UnixTimestamp | undefined {
    const source = /^\d{4}-\d{2}-\d{2}$/.test(input) ? `${input}T00:00:00Z` : input;
    const match =
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}(?:[.,]\d+)?)(?::?(\d{2}(?:[.,]\d+)?))?(?::?(\d{2}(?:[.,]\d+)?))?(Z|[+-]\d{2}:?\d{2})$/
        .exec(source);
    if (match?.[0] !== source) return undefined;
    return wrangle.timestamp(source.replace(/([+-]\d{2})(\d{2})$/, '$1:$2'), match);
  },
} as const;

const wrangle = {
  timestamp(source: string, match: RegExpExecArray | null): t.UnixTimestamp | undefined {
    if (!match) return undefined;
    const [year, month, day, hour, minute, second] = match.slice(1, 7)
      .map((part) => +(part ?? '0').replace(',', '.'));
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (month < 1 || month > 12 || day < 1 || day > days[month - 1]) return undefined;
    if (hour >= 24 || minute >= 60 || second >= 60) return undefined;
    const zone = match[7];
    if (zone !== 'Z') {
      const offset = zone.slice(1).replace(':', '');
      if (+offset.slice(0, 2) > 23 || +offset.slice(2) > 59) return undefined;
    }
    const timestamp = Time.utc(source).timestamp;
    return Num.Is.finite(timestamp) ? timestamp : undefined;
  },
} as const;
