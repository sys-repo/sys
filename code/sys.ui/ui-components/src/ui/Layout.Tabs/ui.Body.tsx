import React from 'react';
import { type t, Color, css, Style } from './common.ts';

export type BodyProps = {
  item?: t.Tabs.Item;
  parts?: t.Tabs.Parts;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Body: React.FC<BodyProps> = (props) => {
  const { parts = {}, item } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      minHeight: 0,
    }),
    inner: css({
      Absolute: 0,
      Scroll: parts.body?.scroll,
      ...Style.toPadding(parts.body?.padding),
      display: 'grid',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.inner.class}>{item?.render({ theme: theme.name })}</div>
    </div>
  );
};
