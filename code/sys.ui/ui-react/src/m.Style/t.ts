import type { t } from './common.ts';
export type * from './t.CssValue.ts';

/**
 * External Libs
 */
export type { Interpolation as CssProperties } from '@emotion/react';

/**
 * Library: CSS tools.
 */
export type StyleLib = {
  css: t.CssTransformer;
  plugin: {
    /**
     * Default options for the SWC React plugin that enables
     * the CSS-in-JS tooling.
     * https://emotion.sh/
     */
    emotion(): t.ReactPluginOptions;
  };
};

/**
 * Options passed to [@vitejs/plugin-react-swc].
 */
export type ReactPluginOptions = {
  jsxImportSource: string;
  plugins: [string, Record<string, any>][];
};

/**
 * A spreadable object to apply to a React element,
 * for example:
 *   const styles = { base: css({ color: 'red' }) };
 *   <div {...style.base} />
 */
export type ReactCssObject = {
  /* Style property passed to react. */
  css: t.SerializedStyles;
};

/**
 * Function that transforms 1..n CSS inputs into a style
 * object that can be applied to a React element.
 */
export type CssTransformer = (...input: t.CssTransformerInput[]) => t.ReactCssObject;
export type CssTransformerInput = t.CssValue | undefined | null | false;
