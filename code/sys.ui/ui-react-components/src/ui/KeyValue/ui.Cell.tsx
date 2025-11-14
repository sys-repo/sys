import React from 'react';
import { type t, Color, css, D } from './common.ts';
import { toEllipsis, toFont } from './u.ts';

type Base = Pick<t.KeyValueProps, 'theme' | 'debug' | 'style' | 'mono' | 'truncate' | 'size'>;
export type CellProps = Base & {
  layout: t.KeyValueLayout;
  children: React.ReactNode;
  role: 'key' | 'val';
};

/**
 * Component:
 */
export const Cell: React.FC<CellProps> = (props) => {
  const { debug = false, role, mono, truncate, size, layout } = props;
  const isKey = role === 'key';
  const isSpaced = layout.kind === 'spaced';

  /**
   * Determine if children are plain text.
   * - Ellipsis is only meaningful for simple text/number nodes.
   */
  const isTextChild = typeof props.children === 'string' || typeof props.children === 'number';

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
      ...(truncate && isTextChild ? toEllipsis(true) : {}), // Ellipsis: only for text children when truncate is enabled.

      // In spaced layout, use an inner grid so
      // JSX <element>'s right-align consistently.
      ...(isSpaced && !isTextChild
        ? {
            display: 'grid',
            width: '100%',
            alignItems: 'center',
            justifyItems: isKey ? 'start' : 'end',
          }
        : {}),
    }),
    asKey: css({
      fontFamily: 'sans-serif',
      opacity: D.keyOpacity,
    }),
  };

  const className = css(styles.base, isKey && styles.asKey, props.style).class;
  return <div className={className}>{props.children}</div>;
};
