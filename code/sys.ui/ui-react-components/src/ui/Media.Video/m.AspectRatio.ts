import { type t, Is } from './common.ts';

export const AspectRatio: t.MediaAspectRatioLib = {
  toNumber(stream) {
    const [track] = stream.getVideoTracks();
    const { width, height, aspectRatio } = track?.getSettings?.() ?? {};
    if (Is.number(aspectRatio) && aspectRatio > 0) return aspectRatio;
    if (Is.number(width) && Is.number(height) && height > 0) return width / height;
    return 0; // Unknown.
  },

  toString(stream, options = {}) {
    const ratio = AspectRatio.toNumber(stream);
    if (!ratio || !isFinite(ratio)) return '0 / 1';

    const maxDen = options.maxDenominator ?? 32;
    const eps = 1e-4; // Acceptable error.

    // Narrow in on best integer pair.
    let bestNum = 0;
    let bestDen = 1;
    let bestErr = Infinity;

    for (let den = 1; den <= maxDen; den++) {
      const num = Math.round(ratio * den);
      const err = Math.abs(ratio - num / den);
      if (err < bestErr - eps) {
        bestNum = num;
        bestDen = den;
        bestErr = err;
        if (err < eps) break; // NB: good enough.
      }
    }

    // Reduce the fraction.
    const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
    const divisor = gcd(bestNum, bestDen);
    bestNum /= divisor;
    bestDen /= divisor;

    // Decide on fraction or rounded decimal.
    if (bestDen <= maxDen && bestErr < eps * 10) {
      return `${bestNum} / ${bestDen}`; // e.g. "16 / 9"
    }

    // Fallback: rounded decimal as "1.778 / 1"
    const rounded = Math.round(ratio * 1000) / 1000;
    return `${rounded} / 1`;
  },
};
