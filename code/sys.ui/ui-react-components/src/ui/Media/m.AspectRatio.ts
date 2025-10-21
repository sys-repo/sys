import { type t, Is, Num } from './common.ts';

export const AspectRatio: t.MediaAspectRatioLib = {
  toNumber(stream) {
    const [track] = stream.getVideoTracks();
    const { width, height, aspectRatio } = track?.getSettings?.() ?? {};
    if (Is.number(aspectRatio) && aspectRatio > 0) return aspectRatio;
    if (Is.number(width) && Is.number(height) && height > 0) return width / height;
    return 0; // Unknown.
  },

  toString(stream, options = {}) {
    const { maxDenominator } = options;
    const ratio = AspectRatio.toNumber(stream);
    if (!ratio || !isFinite(ratio)) return '0/1';
    return Num.Ratio.toString(ratio, {
      maxDenominator,
      maxError: 1e-3, // NB: enforce "good enough" → else decimal/1
    });
  },
};
