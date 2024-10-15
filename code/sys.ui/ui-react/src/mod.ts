/**
 * @module
 * Tools for working with browser based UI (react bindings).
 *
 * @example
 * Import pattern for a simple React component
 *
 * ```ts
 * import type { t } from '@sys/ui-react/t';
 * import { Color, Style, css } from '@sys/ui-react/style';
 *
 * export type FooProps = {
 *   theme?: t.CommonTheme;
 *   style?: t.CssValue;
 * }
 *
 * export const Foo: React.FC<FooProps> = (props) => {
 *   const theme = Color.theme(props.theme);
 *   const styles = {
 *     base: css({ color: Color.alpha(theme.fg, 0.3) }),
 *   };
 *
 *   return (
 *     <div {...css(styles.base, props.style)}>
 *       <div>{`👋 Hello World`}</div>
 *     </div>
 *   );
 * };
 * ```
 */
export { Pkg } from './common.ts';
export { Color, Style, css } from './u/mod.ts';
export { Keyboard, LocalStorage, UserAgent } from './ui/m.Dom/mod.ts';
