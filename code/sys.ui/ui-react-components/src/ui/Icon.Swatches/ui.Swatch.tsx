import React from 'react';
import { type t, Color, css, D } from './common.ts';

export type SwatchProps = {
  path?: t.ObjectPath;
  icon?: t.IconRenderer;
  iconSize?: t.Pixels;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Swatch: React.FC<SwatchProps> = (props) => {
  const { iconSize = 120, path, icon: Icon } = props;

  const PAD = D.Swatch.pad;
  const FOOT = D.Swatch.footerHeight;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      borderRadius: 8,
      boxShadow: `0 2px 25px 0 ${Color.format(-0.2)}`,
      display: 'grid',
    }),
    body: css({
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
      PaddingX: 10,
      fontFamily: 'monospace',
      fontSize: 10,
      height: FOOT,
      opacity: 0.6,
      display: 'grid',
      alignItems: 'center',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        <div className={styles.icon.class}>{Icon && <Icon size={iconSize} />}</div>
        <div className={styles.footer.class}>{path?.join('/')}</div>
      </div>
    </div>
  );
};
