/**
 * @module
 * Tools for working with Styles/CSS (aka "css-in-js") in React.
 *
 * @example
 * Setting up the `vite.config.json` configure the [react-swc] plugin
 * with the [emotion-css] options:
 *
 * ```ts
 * import reactPlugin from '@vitejs/plugin-react-swc';
 * import { Style } from '@sys/ui-react';
 *
 * const react = reactPlugin(Css.plugin.emotion());
 * ```
 *
 * Ensure the `tsconfig` compiler options include:
 *
 * ```json
 * {
 *    "compilerOptions": {
 *      "jsx": "react-jsx",
 *      "jsxImportSource": "@emotion/react",
 *      "jsxImportSourceTypes": "@emotion/react"
 *    }
 * }
 * ```
 *
 * Note: the `jsxImportSourceTypes` sets up editor support to recognize
 * the `css={...}` prioperty on react components.
 *
 * @example
 * Declaring CSS styles within objects and applying then to
 *
 * ```ts
 * import { Color, Style, css } from '@sys/ui-react/style';
 *
 * const theme = Color.theme(props.theme);
 * const styles = {
 *   base: css({
 *     backgroundColor: theme.bg,
 *     color: Color.alpha(theme.fg, 0.3)
 *   }),
 *   label: css({ fontSize: 32 }),
 * };
 *
 * <div {...css(styles.base, props.style)}>
 *   <div {...styles.label}>{`👋 Hello World`}</div>
 * </div>
 * ```
 */
export { Edges, Color } from '../m.Style/mod.ts';
export { Style, css } from './m.Style.ts';
