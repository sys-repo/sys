import { type t } from './common.ts';

type O = Record<string, any>;

/**
 * Parse command line arguments.
 */
export function parseArgs<T extends O = O>(
  argv: string[] = [],
  options: t.ParseArgsOptions = {},
): t.ParsedArgs<T> {
  const {
    boolean = [],
    string = [],
    default: defaults = {},
    alias = {},
    stopEarly = false,
    unknown,
  } = options;

  // The result object starts with an empty positional args array.
  type TAny = Record<string, any>;
  const result: t.ParsedArgs<TAny> = { _: [] };

  // Build alias lookup (both directions).
  const aliasMap: Record<string, string[]> = {};
  for (const key in alias) {
    const values = Array.isArray(alias[key]) ? alias[key] : [alias[key]];
    aliasMap[key] = [...values];
    for (const a of values) {
      if (aliasMap[a] === undefined) aliasMap[a] = [];
      if (!aliasMap[a].includes(key)) aliasMap[a].push(key);
    }
  }

  /**
   * Checks about the current flag.
   */
  const is = {
    booleanFlag(name: string): boolean {
      return boolean.includes(name) || (aliasMap[name]?.some((a) => boolean.includes(a)) ?? false);
    },
    stringFlag(name: string): boolean {
      return string.includes(name) || (aliasMap[name]?.some((a) => string.includes(a)) ?? false);
    },
    numeric(value: unknown): boolean {
      return typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value));
    },
    keyKnown(key: string): boolean {
      if (boolean.includes(key)) return true;
      if (string.includes(key)) return true;
      if (key in defaults) return true;
      if (key in aliasMap) return true;
      return false;
    },
  } as const;

  // Parse each token.
  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];

    // Check if we have reached the "--" token that stops flag parsing.
    if (arg === '--') {
      result._.push(...argv.slice(i + 1));
      break;
    }

    // Flags starting with "--" (long flags).
    if (arg.startsWith('--') && arg.length > 2) {
      const eqIndex = arg.indexOf('=');
      let key: string;
      let val: string | boolean = true;
      if (eqIndex !== -1) {
        key = arg.slice(2, eqIndex);
        val = arg.slice(eqIndex + 1);
      } else {
        key = arg.slice(2);
        // Look ahead: if the next token exists and doesn’t start with a dash,
        // use it as the value (unless this flag is explicitly boolean).
        const next = argv[i + 1];
        if (next !== undefined && !next.startsWith('-') && !is.booleanFlag(key)) {
          val = next;
          i++; // consume the next token
        }
      }

      // If the flag is unknown and unknown() opts out, skip it.
      if (unknown && !is.keyKnown(key) && !unknown(`--${key}`)) {
        i++;
        continue;
      }

      processKeyValue(key, val);
    }

    // Short flags (can be clustered) starting with "-"
    else if (arg.startsWith('-') && arg.length > 1) {
      // Slice off the "-" and get the cluster of letters (e.g. "abc" in "-abc")
      const cluster = arg.slice(1);

      let j = 0;
      while (j < cluster.length) {
        const key = cluster[j];
        let value: string | boolean = true;

        /**
         * If there's something *immediately following* the current letter within
         * the same token AND it looks like a numeric value (e.g. -n5),
         * interpret that remainder as the value for `n`.
         *
         * Example:
         *    arg = '-n5'
         *    cluster = 'n5'
         *    cluster[j] = 'n'
         *    cluster.slice(j+1) = '5'
         *
         * This logic sets n=5 (instead of n=true, then separate short-flag '5').
         */
        const remainder = cluster.slice(j + 1); // what's left after this letter

        if (remainder && is.numeric(remainder)) {
          // -n5 => key: 'n' and val: '5'
          value = remainder;
          // Once we've used up the remainder for the current letter,
          // we won't keep parsing additional letters in this same token.
          j = cluster.length; // skip the rest of the cluster
        } else {
          // If this is the last letter in the cluster,
          // we can see if the next *separate* token is a value.
          if (j === cluster.length - 1) {
            const next = argv[i + 1];
            if (next !== undefined && !next.startsWith('-') && !is.booleanFlag(key)) {
              value = next;
              i++; // Consume the next token.
            }
          }
          // Otherwise, if there's more letters left in the cluster, we just do `key=true`.
          j++;
        }

        if (unknown && !is.keyKnown(key) && !unknown(`-${key}`)) {
          continue;
        }
        processKeyValue(key, value);
      }
    }

    // Positional arguments.
    else {
      // If we have stopEarly set and at least one positional arg,
      // all remaining tokens are treated as positional.
      if (stopEarly && result._.length > 0) {
        result._.push(...argv.slice(i));
        break;
      }
      result._.push(arg);
    }
    i++;
  }

  // Apply defaults for keys not set.
  for (const key in defaults) {
    if (result[key] === undefined) result[key] = defaults[key];
  }

  /**
   * Helper function that sets the key/value pair in the result.
   *
   * If the key has been set before, then we convert it (or push) into an array,
   * following minimist's behavior.
   */
  function processKeyValue(key: string, value: string | boolean) {
    let finalValue: string | boolean | number = value;

    // For boolean flags, coerce string representations.
    if (is.booleanFlag(key)) {
      if (typeof finalValue === 'string') {
        if (finalValue === 'false') finalValue = false;
        else if (finalValue === 'true') finalValue = true;
        else finalValue = true;
      }
    }
    // If it's not a "stringFlag" and is numeric, convert to a number.
    else if (!is.stringFlag(key) && is.numeric(finalValue)) {
      finalValue = Number(finalValue);
    }

    // Normalize key: apply the value to the key and all its aliases.
    const keys = [key, ...(aliasMap[key] || [])];
    for (const k of keys) {
      const existing = result[k];
      if (existing === undefined) {
        result[k] = finalValue;
      } else if (Array.isArray(existing)) {
        result[k].push(finalValue);
      } else {
        result[k] = [existing, finalValue];
      }
    }
  }

  // Finish up.
  return result as t.ParsedArgs<T>;
}
