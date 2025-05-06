import type { t } from './common.ts';

export const Calc = {
  /**
   * Master entry: decide whether an <hr> should appear between [prev/next].
   */
  showHr(prop: t.ModuleListProps['hr'], prev: string, next: string): boolean {
    /* 1. Pure depth number. */
    if (typeof prop === 'number') return Calc.showHrByDepth(prop, prev, next);

    /* 2. Callback supplied. */
    if (typeof prop === 'function') {
      const { evaluate, args } = createHrArgs(prev, next);
      const result = prop(args);

      /* 2a. Caller explicitly returned a value. */
      if (typeof result === 'number') return Calc.showHrByDepth(result, prev, next);
      if (typeof result === 'boolean') return result;

      /* 2b. No return → fall back to accumulated rules. */
      return evaluate();
    }

    /* 3. Fallback: no break. */
    return false;
  },

  /**
   * Depth‑based rule.
   */
  showHrByDepth(depth: number, prev: string, next: string): boolean {
    if (depth > 1 && prev && next) {
      const split = (s: string) => s.split('.').slice(0, depth).join('.');
      return split(prev) !== split(next);
    }
    return false;
  },
};

/**
 * Helpers:
 */
export function createHrArgs(prev?: string, next?: string) {
  const rules: t.ModuleListHrRule[] = [];

  /** Normalise `roots` once, then return a rule. */
  const buildByRoots = (roots: string[]): t.ModuleListHrRule => {
    // Split the config into “static” and “prefix‑with‑dot” roots.
    const STATIC = roots.filter((r) => !/[.:]$/.test(r)); // e.g. 'sys.ui'
    const PREFIXES = roots
      .filter((r) => /[.:]$/.test(r)) // e.g. 'tdb.slc.'
      .map((r) => r.replace(/[.:]$/, '')); // strip the dot

    /**
     * Helpers:
     */
    const startsWithNs = (str = '', ns: string) => {
      return str === ns || str.startsWith(ns + '.') || str.startsWith(ns + ':');
    };

    const firstSegAfter = (str = '', ns: string) => {
      const rest = str.slice(ns.length + 1); // skip the dot/colon
      return rest.split(/[.:]/)[0] ?? '';
    };

    /**
     * Rule:
     */
    return (prev?: string, next?: string): boolean => {
      /* 1 · Different static roots → break */
      for (const ns of STATIC) {
        const inPrev = startsWithNs(prev, ns);
        const inNext = startsWithNs(next, ns);
        if (inPrev !== inNext) return true; // entered or left ns
      }

      /* 2 · For each “prefix.” root, compare first sub‑segment */
      for (const ns of PREFIXES) {
        const inPrev = startsWithNs(prev, ns);
        const inNext = startsWithNs(next, ns);

        if (inPrev && inNext) {
          const segPrev = firstSegAfter(prev, ns);
          const segNext = firstSegAfter(next, ns);
          if (segPrev !== segNext) return true; // ui ↔ entry etc.
        } else if (inPrev !== inNext) {
          return true; // crossed boundary
        }
      }

      /* 3 · No rule matched → keep the list continuous */
      return false;
    };
  };

  /** Regex rule builder. */
  const buildByRegex =
    (re: RegExp): t.ModuleListHrRule =>
    (p, n) =>
      !!p && !!n && re.test(p) !== re.test(n);

  /** Depth rule builder (wraps legacy util). */
  const buildDepth =
    (n: number): t.ModuleListHrRule =>
    (p, nxt) =>
      Calc.showHrByDepth(n, p ?? '', nxt ?? '');

  /** Evaluate collected rules in order until one matches. */
  const evaluate = (): boolean => {
    for (const r of rules) {
      if (typeof r === 'number') {
        if (Calc.showHrByDepth(r, prev ?? '', next ?? '')) return true;
      } else if (r(prev, next)) {
        return true;
      }
    }
    return false;
  };

  /** Public object passed to the user callback. */
  const args: t.ModuleListShowHrArgs = {
    prev,
    next,

    rule: (rule) => rules.push(rule),

    byRoots(roots) {
      const r = buildByRoots(roots);
      rules.push(r);
      return args;
    },

    depth(n) {
      const r = buildDepth(n);
      rules.push(r);
      return args;
    },

    byRegex(regex) {
      const r = buildByRegex(regex);
      rules.push(r);
      return args;
    },

    segment: (s, n) => s?.split(/[.:]/)[n] ?? '',
  };

  // Finish up.
  return { args, evaluate } as const;
}
