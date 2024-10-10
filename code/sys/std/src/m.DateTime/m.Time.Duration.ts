import { StdDate, Value, type t } from './common.ts';
const { MINUTE, SECOND, DAY, HOUR } = StdDate;

const To: t.TimeDurationTo = {
  sec: (msec: number, round?: number) => Value.round(msec / 1000, round),
  min: (msec: number, round?: number) => Value.round(msec / 1000 / 60, round),
  hour: (msec: number, round?: number) => Value.round(msec / 1000 / 60 / 60, round),
  day: (msec: number, round?: number) => Value.round(msec / 1000 / 60 / 60 / 24, round),
};

/**
 * Library: tools for working with an elapsed duration of time.
 */
export const Duration: t.TimeDurationLib = {
  /* Time duration conversions. */
  To,

  /**
   * Create a new duration helper.
   */
  create(input, options = {}) {
    if (typeof input === 'string') return Duration.parse(input, options);

    const { round = 1 } = options;
    const msecs = input < 0 ? -1 : input;

    const api: t.TimeDuration = {
      ok: msecs >= 0,
      msec: msecs,
      sec: To.sec(msecs, round),
      min: To.min(msecs, round),
      hour: To.hour(msecs, round),
      day: To.day(msecs, round),

      toString(unit?: t.TimeUnit | { unit?: t.TimeUnit; round?: number }): string {
        const msecs = this.msec;
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
    };
    return api;
  },

  /**
   * Parses a string or a number (eg. "3.5h") into a Duration helper.
   */
  parse(input, options = {}) {
    const done = (msecs: number) => Duration.create(msecs, options);
    if (typeof input === 'number') return done(input);

    // Extract number.
    input = (input || '').trim();
    const matchedDigits = input.match(/(\d*\.?)\d*/);
    const digits = matchedDigits && matchedDigits[0] ? +matchedDigits[0] : -1;
    if (digits < 0) return done(-1);

    // Extract and multiply by unit (sec, min, hour, day).
    input = input.substring(digits.toString().length).trim().toLowerCase();

    switch (input) {
      case '':
      case 'ms':
      case 'msec':
        return done(digits); // NB: no multiplier (default unit).

      case 's':
      case 'sec':
        return done(digits * StdDate.SECOND);

      case 'm':
      case 'min':
        return done(digits * StdDate.MINUTE);

      case 'h':
      case 'hour':
        return done(digits * StdDate.HOUR);

      case 'd':
      case 'day':
        return done(digits * StdDate.DAY);

      default:
        return done(-1); // NB: Unit is invalid.
    }
  },

  /**
   * Format milliseconds to a display string.
   */
  format(msec, unit, round = 0) {
    switch (unit) {
      case 'ms':
      case 'msec':
        return `${msec}ms`;

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
};
