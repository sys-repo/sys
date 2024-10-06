import type { CssProperties } from '../types.ts';
import type { t } from './common.ts';

/**
 * External Libs
 */
export type { Interpolation as CssProperties } from '@emotion/react';

/**
 * Library: CSS tools.
 */
export type StyleLib = {
  /**
   * Default options for the SWC react plugin that enables
   * the CSS-in-JS tooling.
   * https://emotion.sh/
   */
  pluginOptions(): t.ReactPluginOptions;
};

/**
 * Options passed to [@vitejs/plugin-react-swc].
 */
export type ReactPluginOptions = {
  jsxImportSource: string;
  plugins: [string, Record<string, any>][];
};

/**
 * CSS
 */
export type CssMacros = {
  Absolute?: [];
};

export type CssValue = CssProperties & CssMacros;
