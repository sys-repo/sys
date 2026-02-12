import React from 'react';
import { type t, Button, Color, css, D } from './common.ts';

export type TabProps = {
  index: t.Index;
  item: t.Tabs.Item;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Tab: React.FC<TabProps> = (props) => {
  const { item } = props;

  /**
   * Handlers:
   */
  function handleClick() {
    console.log('click');
  }

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      height: D.Tabstrip.height,
      display: 'grid',
      minWidth: 0,
      fontSize: 14,
    }),
    btn: css({ display: 'grid' }),
    body: css({ display: 'grid', placeItems: 'center' }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Button theme={theme.name} onClick={handleClick} style={styles.btn}>
        <div className={styles.body.class}>{item.label || item.id}</div>
      </Button>
    </div>
  );
};
