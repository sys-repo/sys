import { Err, Is, Num, type t, Time } from '../common.ts';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

const DEFAULT = 2 * DAY;
const EXPECTED = 'expected minutes, ISO-8601 duration, RFC3339 date/timestamp, or 0';

/** Deno-compatible parser for `--minimum-dependency-age`. */
export const MinimumDependencyAge = Object.freeze({
  /** CLI-surfaced default: 48 hours. */
  default: DEFAULT as t.Msecs,

  parse(input: unknown, evaluatedAt: t.UnixTimestamp): t.Msecs {
    const value = wrangle.one(input);
    if (value === undefined) {
      if (input === undefined) return MinimumDependencyAge.default;
      throw Err.std('Option requires a value: --minimum-dependency-age');
    }
    if (value === '') throw Err.std('Option requires a value: --minimum-dependency-age');

    const parsed = wrangle.minutes(value) ?? wrangle.isoDuration(value) ??
      wrangle.cutoff(value, evaluatedAt);
    if (parsed === undefined || !Num.Is.finite(parsed) || parsed < 0) {
      throw Err.std(`Invalid minimum dependency age: ${value} (${EXPECTED})`);
    }
    return parsed as t.Msecs;
  },
} as const);

const wrangle = {
  one(input: unknown): string | undefined {
    if (Is.str(input)) return input.trim();
    if (Is.array<string>(input) && Is.str(input[0])) return input[0].trim();
    return undefined;
  },

  minutes(input: string): t.Msecs | undefined {
    if (!/^\d+(?:\.\d+)?$/.test(input)) return undefined;
    const minutes = +input;
    if (!Num.Is.finite(minutes)) return undefined;
    return (minutes * MINUTE) as t.Msecs;
  },

  isoDuration(input: string): t.Msecs | undefined {
    const weeks = /^P(\d+(?:\.\d+)?)W$/i.exec(input);
    if (weeks) return wrangle.part(weeks[1]) * WEEK;

    const parts =
      /^P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i
        .exec(input);
    if (!parts) return undefined;

    const hasValue = parts.slice(1).some((part) => part !== undefined);
    if (!hasValue) return undefined;

    const days = wrangle.part(parts[1]);
    const hours = wrangle.part(parts[2]);
    const minutes = wrangle.part(parts[3]);
    const seconds = wrangle.part(parts[4]);
    return (days * DAY + hours * HOUR + minutes * MINUTE + seconds * 1000) as t.Msecs;
  },

  cutoff(input: string, evaluatedAt: t.UnixTimestamp): t.Msecs | undefined {
    const timestamp = wrangle.cutoffTimestamp(input);
    if (!timestamp) return undefined;
    const cutoff = Time.utc(timestamp).timestamp;
    if (!Num.Is.finite(cutoff)) return undefined;
    return (evaluatedAt - cutoff) as t.Msecs;
  },

  cutoffTimestamp(input: string): string | undefined {
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return `${input}T00:00:00.000Z`;
    if (/^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:?\d{2})$/i.test(input)) return input;
    return undefined;
  },

  part(input: string | undefined): number {
    if (!input) return 0;
    const value = +input;
    return Num.Is.finite(value) ? value : -1;
  },
} as const;
