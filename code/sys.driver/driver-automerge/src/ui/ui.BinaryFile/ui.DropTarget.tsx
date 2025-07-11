import React from 'react';
import { type t, Color, css, usePointer } from './common.ts';

export type DropTargetProps = {
  doc?: t.Crdt.Ref;
  isDragdropping?: boolean;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const DropTarget: React.FC<DropTargetProps> = (props) => {
  const { doc, isDragdropping = false } = props;

  /**
   * Hooks:
   */
  const pointer = usePointer();
  const showBorder = pointer.is.focused || isDragdropping;

  // Prepare display message:
  const action = pointer.is.focused ? 'Paste or drag' : 'Drag';
  let msg = isDragdropping ? 'Drop now' : `${action} file here`;
  if (!doc) msg = '( Drop target not ready )';

  /**
   * Handlers:
   */


  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
      placeItems: 'center',
    }),
    label: css({
      userSelect: 'none',
      opacity: doc ? 1 : 0.2,
      transition: `opacity 120ms ease`,
    }),
    border: css({
      pointerEvents: 'none',
      Absolute: 10,
      opacity: 0.6,
    }),
  };

  const dash = { len: 8, gap: 6 };
  const elBorder = showBorder && (
    <div className={styles.border.class}>
      <svg width="100%" height="100%">
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          rx={30}
          ry={30}
          fill="none"
          stroke={Color.alpha(theme.fg, 1)}
          strokeWidth={2}
          strokeDasharray={`${dash.len} ${dash.gap}`}
        />
      </svg>
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class} {...pointer.handlers} tabIndex={0}>
      <div className={styles.label.class}>{msg}</div>
      {elBorder}
    </div>
  );
};
