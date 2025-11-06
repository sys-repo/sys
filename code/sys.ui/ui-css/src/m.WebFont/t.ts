import type { t } from './common.ts';

/**
 * Tools for working with web-fonts.
 */
export type WebFontLib = {
  /**
   * Injects @font-face rules for the given family into <head> once.
   * SSR-safe: returns { injected:false } if there is no DOM.
   */
  inject(dir: t.StringDir, opts: t.WebFontOptions): t.WebFontInjectResult;
};

/** Standard numeric font weights. */
export type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | number;

/** Options passed to `WebFont.inject` */
export type WebFontOptions = {
  readonly family: string;
  readonly variable?: boolean; // default: true
  readonly weights?: readonly FontWeight[]; // when variable=false; default: [400]
  readonly italic?: boolean; // default: false
  readonly display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional'; // default: 'swap'
  readonly local?: readonly string[];
  readonly fileForStatic?: (p: {
    family: string;
    weight: t.FontWeight;
    italic: boolean;
    dir: t.StringDir;
  }) => string;
  readonly fileForVariable?: (p: { family: string; italic: boolean; dir: string }) => string;
};

/** Result from the `WebFont.inject` method */
export type WebFontInjectResult = {
  readonly id: string;
  readonly injected: boolean;
};
