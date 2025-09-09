import React from 'react';
import { type t, Color, css, D, usePointer } from './common.ts';

export type SwatchProps = {
  path?: t.ObjectPath;
  icon?: t.IconRenderer;
  iconSize?: t.Pixels;
  selected?: boolean;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onSelect?: t.IconSwatchesSelectHandler;
};

/**
 * Component:
 */
export const Swatch: React.FC<SwatchProps> = (props) => {
  const { iconSize = 120, path, icon: Icon, selected = false } = props;
  const label = path?.join('/') ?? '';
  const PAD = D.Swatch.pad;
  const FOOT = D.Swatch.footerHeight;

  /**
   * Hooks:
   */
  const pointer = usePointer({
    onDown(e) {
      if (path) props.onSelect?.({ path });
    },
  });

  /**
   * Render:
   */
  const isDown = pointer.is.down;
  const theme = Color.theme(props.theme);
  const borderRadius = 8;
  const styles = {
    base: css({
      position: 'relative',
      borderRadius,
      boxShadow: `0 2px ${isDown ? 10 : 25}px 0 ${Color.format(selected ? -0.35 : -0.2)}`,
      transform: `translateY(${isDown ? 1 : 0}px)`,
      userSelect: 'none',
      display: 'grid',
    }),
    body: css({
      position: 'relative',
      display: 'grid',
      gridTemplateRows: '1fr auto',
      aspectRatio: '1 / 1',
    }),
    icon: css({
      padding: PAD,
      display: 'grid',
      placeItems: 'center',
    }),
    footer: css({
      position: 'relative',
      borderTop: `solid 1px ${Color.alpha(theme.fg, 0.1)}`,
      PaddingX: 10,
      height: FOOT,
      display: 'grid',
      alignItems: 'center',
      minWidth: 0, // allow shrinking inside grid
    }),
    footerText: css({
      display: 'block',
      width: '100%',
      minWidth: 0,
      fontFamily: 'monospace',
      fontSize: 9,
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
    }),
    selected: css({
      Absolute: 0,
      pointerEvents: 'none',
      borderRadius,
      border: `solid 1.5px ${Color.alpha(Color.BLUE, 1)}`,
    }),
  };

  const elFooter = (
    <div className={styles.footer.class}>
      <span className={styles.footerText.class} title={label}>
        {label}
      </span>
    </div>
  );

  const elSelectedBorder = selected && <div className={styles.selected.class} />;

  return (
    <div className={css(styles.base, props.style).class} {...pointer.handlers}>
      <div className={styles.body.class}>
        <div className={styles.icon.class}>{Icon && <Icon size={iconSize} />}</div>
        {elFooter}
      </div>
      {elSelectedBorder}
    </div>
  );
};
