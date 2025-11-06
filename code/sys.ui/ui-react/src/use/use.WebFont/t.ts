import type { WebFontOptions } from '@sys/ui-css/t';
import type { t } from './common.ts';

/**
 * Hook that injects @font-face rules for the given family into <head> once.
 * SSR-safe: returns { injected:false } if there is no DOM.
 *
 * Idempotent, calls upstream to core implementation: @sys/ui-css:WebFont
 */
export type UseWebFont = (dir: t.StringDir, opts: WebFontOptions) => void;
