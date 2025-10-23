import React from 'react';
import { type t, Color, css, Is } from './common.ts';
import { toSpacing } from './u.ts';

type P = t.KeyValueItemProps;

/**
 * Component:
 */
export const Hr: React.FC<P> = (props) => {
  const { debug = false, item } = props;
  if (item.kind !== 'hr') return null;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const spacing = toSpacing(item.x, item.y ?? 5);
  const styles = {
    base: css({
      Margin: spacing.edges,
      position: 'relative',
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
