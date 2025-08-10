import React from 'react';
import { type t, Color, css, D, Icons, Style, usePointer } from './common.ts';

export const IndexItem: React.FC<t.IndexTreeItemProps> = (props) => {
  const {
    debug = false,
    label = D.label,
    enabled = D.enabled,
    active = D.active,
    chevron = D.chevron,
    selected = D.selected,
  } = props;
  const isActive = active && enabled;

  /**
   * Hooks:
   */
  const [pointerIs, setPointerIs] = React.useState<t.PointerHookFlags>();
  const pointer = usePointer((e) => {
    const wasDown = pointerIs?.down;
    setPointerIs(e.is);
    props.onPointer?.(e);
    if (isActive && e.is.down) props.onPressDown?.(e);
    if (isActive && e.is.up && wasDown) props.onPressUp?.(e);
  });

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      cursor: isActive ? 'pointer' : 'default',
      backgroundColor: selected ? Color.BLUE : undefined,

      ...Style.toPadding(props.padding ?? D.padding),

      borderBottom: `solid 1px ${Color.alpha(theme.fg, 0.15)}`,
      ':last-child': { borderBottom: 'none' },

      display: 'grid',
    }),
    body: css({
      backgroundColor: Color.ruby(debug),
      userSelect: 'none',
      opacity: enabled ? 1 : 0.2,
      transition: 'opacity 120ms ease',

      display: 'grid',
      gridTemplateColumns: '1fr auto',
      alignItems: 'center',
    }),

    label: css({ transform: `translateY(${isActive && pointerIs?.down ? 1 : 0}px)` }),
    chevron: css({ visibility: chevron ? 'visible' : 'hidden' }),
  };

  const elChevron = (
    <div className={styles.chevron.class}>
      {React.isValidElement(chevron) ? chevron : <Icons.Chevron.Right />}
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class} {...pointer.handlers}>
      <div className={styles.body.class}>
        <div className={styles.label.class}>{label}</div>
        {elChevron}
      </div>
    </div>
  );
};
