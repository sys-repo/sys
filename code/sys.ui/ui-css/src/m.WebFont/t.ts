import type { t } from './common.ts';

export type * from './t.font.config.ts';

/**
 * Tools for working with web-fonts.
 */
export type WebFontLib = {
  /**
   * Injects @font-face rules for the given family into <head> once.
   * SSR-safe: returns { injected:false } if there is no DOM.
   */
  inject(dir: t.StringDir, opts: t.WebFontConfig): t.WebFontInjectResult;

  /**
   *
   */
  def(opts: t.WebFontConfig): t.WebFontConfig;
};

/** Result from the `WebFont.inject` method */
export type WebFontInjectResult = {
  readonly id: string;
  readonly injected: boolean;
};
