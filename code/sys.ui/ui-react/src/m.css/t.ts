import type { t } from './common.ts';

/**
 * Library: CSS tools.
 */
export type CssLib = {
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
