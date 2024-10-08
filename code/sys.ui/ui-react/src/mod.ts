/**
 * @module
 * Tools for ...
 *
 * @example
 * ```ts
 * import { Color, Style, css } from '@sys/ui-react/style';
 *
 * const theme = Color.theme(props.theme);
 * const styles = {
 *   base: css({ color: Color.alpha(theme.fg, 0.3) }),
 * };
 *
 * <div {...css(styles.base, props.style)}>
 *   <div>{`👋 Hello World`}</div>
 * </div>
 * ```
 */
export { Pkg } from './common.ts';
export { Style, css } from './m.Style/mod.ts';
export { Color } from './m.Color/mod.ts';
