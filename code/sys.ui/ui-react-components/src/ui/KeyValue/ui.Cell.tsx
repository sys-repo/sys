import React from 'react';
import { type t, Color, css, D } from './common.ts';
import { toEllipsis, toFont } from './u.ts';

type Base = Pick<t.KeyValueProps, 'theme' | 'debug' | 'style' | 'mono' | 'truncate' | 'size'>;
export type CellProps = Base & {
  children: React.ReactNode;
  role: 'key' | 'val';
};

/**
 * Component:
 */
export const Cell: React.FC<CellProps> = (props) => {
  const { debug = false, role, mono, truncate, size } = props;
  const isKey = role === 'key';

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const { fontSize, fontFamily } = toFont({ size, mono });
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      minWidth: 0,
      fontSize,
      fontFamily,
      ...toEllipsis(truncate),
    }),
    asKey: css({
      fontFamily: 'sans-serif',
      opacity: D.keyOpacity,
    }),
  };

  const className = css(styles.base, isKey && styles.asKey, props.style).class;
  return <div className={className}>{props.children}</div>;
};
