/**
 * @module
 * Tools for working with browser based UI (react bindings).
 *
 * @example
 * Import pattern for a simple React component
 *
 * ```ts
 * import type { t } from '@sys/ui-dev-harness/t';
 * import { Color, Style, css } from '@sys/ui-dev-harness/style';
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
