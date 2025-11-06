import type { WebFontLib as Base, WebFontConfig } from '@sys/ui-css/t';
import type { t } from './common.ts';

/**
 * Tools for working with web-fonts.
 */
export type WebFontLib = Base & {
  readonly useWebFont: t.UseWebFont;
};

/**
 * Hook that injects @font-face rules for the given family into <head> once.
 * SSR-safe: returns { injected:false } if there is no DOM.
 *
 * Idempotent, calls upstream to core implementation: @sys/ui-css:WebFont
 */
export type UseWebFont = (dir: t.StringDir, opts: WebFontConfig) => void;
