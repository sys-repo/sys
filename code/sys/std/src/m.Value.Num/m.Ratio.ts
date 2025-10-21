import { type t } from './common.ts';

export const Ratio: t.RatioLib = {
  parse(value) {
    if (value == null) return undefined;
    if (typeof value === 'number') return isFinite(value) && value > 0 ? value : undefined;
    const expr = value.replace(/\s+/g, '');
    if (/^\d+\/\d+$/.test(expr)) {
      const [a, b] = expr.split('/').map(Number);
      if (b === 0) return undefined;
      const r = a / b;
      return isFinite(r) && r > 0 ? r : undefined;
    }
    const n = Number(expr);
    return isFinite(n) && n > 0 ? n : undefined;
  },

  toFraction(value, maxDenominator = 32) {
    if (!value || !isFinite(value) || value <= 0) return undefined;

    const eps = 1e-4;
    let bestNum = 0;
    let bestDen = 1;
    let bestErr = Number.POSITIVE_INFINITY;

    for (let den = 1; den <= maxDenominator; den++) {
      const num = Math.round(value * den);
      const err = Math.abs(value - num / den);
      if (err < bestErr - eps) {
        bestNum = num;
        bestDen = den;
        bestErr = err;
        if (err < eps) break;
      }
    }

    // reduce fraction (robust gcd)
    const gcd = (a: number, b: number): number => {
      a = Math.abs(a | 0);
      b = Math.abs(b | 0);
      while (b) [a, b] = [b, a % b];
      return a || 1;
    };

    const d = gcd(bestNum, bestDen);
    return { num: bestNum / d, den: bestDen / d };
  },

  toString(value, options) {
    const ratio = value;
    if (!ratio || !isFinite(ratio) || ratio <= 0) return '0/1';

    const maxDen = options?.maxDenominator ?? 32;
    const spaces = options?.spaces ?? false;
    const f = Ratio.toFraction(ratio, maxDen);
    const sep = spaces ? ' / ' : '/';

    if (f) return `${f.num}${sep}${f.den}`;

    const rounded = Math.round(ratio * 1000) / 1000;
    return `${rounded}${sep}1`;
  },
};
