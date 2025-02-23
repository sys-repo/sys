/**
 * @module
 * Tools for working with DOM/browser based UI react bindings.
 *
 * @example
 * Import pattern for a simple React component
 *
 * ```ts
 * import type { t } from '@sys/ui-common/t';
 * import { Color, Style, css } from '@sys/ui-common';
 *
 * export type FooProps = {
 *   theme?: t.CommonTheme;
 *   style?: t.CssInput;
 * }
 *
 * export const Foo: React.FC<FooProps> = (props) => {
 *   const theme = Color.theme(props.theme);
 *   const styles = {
 *     base: css({ color: Color.alpha(theme.fg, 0.3) }),
 *   };
 *
 *   return (
 *     <div style={css(styles.base, props.style)}>
 *       <div>{`👋 Hello World`}</div>
 *     </div>
 *   );
 * };
 * ```
 */
export { pkg } from './pkg.ts';
export type * as t from './types.ts';

export { FC } from './m.FC/mod.ts';
export { useClickInside, useClickOutside, useMouse, useMouseDrag } from './m.use/mod.ts';
export { ReactEvent } from './u/mod.ts';
