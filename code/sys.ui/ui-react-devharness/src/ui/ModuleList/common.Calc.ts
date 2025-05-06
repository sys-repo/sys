import type { t } from '../common.ts';

export const Calc = {
  /**
   * Master entry: decide whether an <hr> should appear between `prev`/`next`.
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
   * Legacy depth‑based rule (unchanged).
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
const createHrArgs = (prev?: string, next?: string) => {
  const rules: t.ModuleListHrRule[] = []; // collected via `add(...)`

  /** Normalise `roots` once, return a rule. */
  const buildByRoots = (roots: string[]): t.ModuleListHrRule => {
    const clean = (s: string) => s.replace(/[.:]$/, '');
    const rootSet = new Set(roots.map(clean));

    const rootOf = (val?: string): string => {
      if (!val) return '';
      const segs = val.split(/[.:]/);
      const parts: string[] = [];
      for (const seg of segs) {
        parts.push(seg);
        const candidate = parts.join('.');
        if (rootSet.has(candidate)) return candidate;
      }
      return '';
    };

    return (p?: string, n?: string) => rootOf(p) !== rootOf(n);
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

  return { args, evaluate };
};
