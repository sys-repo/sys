import React from 'react';
import { type t, Color, css, Is } from './common.ts';

type P = t.KeyValueItemProps;

/**
 * Component:
 */
export const Hr: React.FC<P> = (props) => {
  const { debug = false, item } = props;
  if (item.kind !== 'hr') return null;

  // item.
  const x = toOffset(item.x);
  const y = toOffset(item.y ?? 5);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      Padding: [y[0], x[1], y[1], x[0]],
      display: 'grid',
    }),
    line: css({
      backgroundColor: theme.fg,
      height: item.thickness ?? 1,
      opacity: item.opacity ?? 0.2,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.line.class} />
    </div>
  );
};

/**
 * Helpers:
 */
export function toOffset(
  value?: t.Pixels | [t.Pixels, t.Pixels],
): [t.Pixels | undefined, t.Pixels | undefined] {
  if (value == null) return [undefined, undefined];
  if (Is.array(value)) return [value[0], value[1]];
  if (Is.number(value)) return [value, value];
  return [undefined, undefined];
}
