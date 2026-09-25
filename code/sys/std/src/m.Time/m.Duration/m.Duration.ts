import { Date as TimeDate } from '../../m.Time.Date/mod.ts';
import { Is, Num, type t } from './common.ts';

const { MINUTE, SECOND, DAY, HOUR } = TimeDate;

const To = Object.freeze(
  {
    sec: (msec: t.Msecs, round?: number): t.Secs => Num.round(msec / 1000, round),
    min: (msec: t.Msecs, round?: number): t.Mins => Num.round(msec / 1000 / 60, round),
    hour: (msec: t.Msecs, round?: number): t.Hours => Num.round(msec / 1000 / 60 / 60, round),
    day: (msec: t.Msecs, round?: number): t.Days => Num.round(msec / 1000 / 60 / 60 / 24, round),
  } satisfies t.Time.Duration.To,
);

/**
 * Library: tools for working with an elapsed duration of time.
 */
export const Duration: t.Time.Duration.Lib = Object.freeze({
  /** Time duration conversions. */
  To,

  /**
   * Create a new duration helper.
   */
  create(input, options = {}) {
    if (Is.str(input)) return Duration.parse(input, options);

    const { round = 1 } = options;
    const ok = Is.numeric(input) && input >= 0;
    const msecs = ok ? (input === 0 ? 0 : input) : -1;

    const api: t.Time.Duration.Instance = {
      ok,
      msec: msecs,
      sec: ok ? To.sec(msecs, round) : -1,
      min: ok ? To.min(msecs, round) : -1,
      hour: ok ? To.hour(msecs, round) : -1,
      day: ok ? To.day(msecs, round) : -1,

      format(unit) {
        const format = Duration.format;
        const options = typeof unit === 'object' ? unit : { unit };
        const round = typeof options.round === 'number' ? options.round : 0;

        if (options.unit !== undefined) return format(msecs, options.unit, round);
        if (msecs < SECOND) return format(msecs, 'ms', round);
        if (msecs < MINUTE) return format(msecs, 's', round);
        if (msecs < HOUR) return format(msecs, 'm', round);
        if (msecs < DAY) return format(msecs, 'h', round);

        return format(msecs, 'd', round);
      },

      toString() {
        return api.format();
      },
    };
    return api;
  },

  /**
   * Time elapsed between two instants.
   * @param start earlier instant (ms or ISO string)
   * @param end   later instant (default `Date.now()`)
   */
  elapsed(start, end = Date.now(), options) {
    const diff = wrangle.msecs(end) - wrangle.msecs(start);
    return Duration.create(diff, options);
  },

  /**
   * Parse a complete decimal amount and optional unit, or numeric milliseconds.
   */
  parse(input, options = {}) {
    const done = (msecs: number) => Duration.create(msecs, options);
    if (!Is.str(input)) return done(input);

    const pattern = /^(\d+(?:\.\d*)?|\.\d+)\s*(ms|msec|s|sec|m|min|h|hour|d|day)?$/i;
    const match = input.trim().match(pattern);
    if (!match) return done(-1);
    const amount = Number(match[1]);
    const unit = match[2]?.toLowerCase() ?? '';

    switch (unit) {
      case '':
      case 'ms':
      case 'msec':
        return done(amount);

      case 's':
      case 'sec':
        return done(amount * SECOND);

      case 'm':
      case 'min':
        return done(amount * MINUTE);

      case 'h':
      case 'hour':
        return done(amount * HOUR);

      case 'd':
      case 'day':
        return done(amount * DAY);

      default:
        return done(-1);
    }
  },

  /**
   * Format milliseconds to a display string.
   */
  format(msec, unit, round = 0) {
    switch (unit) {
      case 'ms':
      case 'msec':
        return `${Num.round(msec, round)}ms`;

      case 's':
      case 'sec':
        return `${To.sec(msec, round)}s`;

      case 'm':
      case 'min':
        return `${To.min(msec, round)}m`;

      case 'h':
      case 'hour':
        return `${To.hour(msec, round)}h`;

      case 'd':
      case 'day':
        return `${To.day(msec, round)}d`;

      default:
        throw new Error(`Unit '${unit}' not supported `);
    }
  },
});

/**
 * Helpers:
 */
const wrangle = {
  msecs(input: t.Time.Duration.InstantInput): t.Msecs {
    if (!Is.str(input)) return input;

    // Try a purely numeric string first.
    const asNum = Number(input);
    if (!Number.isNaN(asNum)) return asNum as t.Msecs;

    // Fallback to ISO-8601 parsing.
    const parsed = Date.parse(input);
    if (!Number.isNaN(parsed)) return parsed as t.Msecs;

    throw new Error(`Invalid Time.Duration.Input: “${input}”`);
  },
} as const;
