import React from 'react';
import { type t, Button, Color, css, D } from './common.ts';

export type TabProps = {
  item: t.Tabs.Item;
  selected?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onClick?: t.Tabs.ChangeHandler;
};

/**
 * Component:
 */
export const Tab: React.FC<TabProps> = (props) => {
  const { item, selected = false } = props;
  const id = item.id;

  /**
   * Hooks:
   */
  const [isOver, setOver] = React.useState(false);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  let color = Color.alpha(theme.fg, selected ? 1 : 0.4);
  if (isOver && !selected) color = Color.BLUE;

  const styles = {
    base: css({
      height: D.Tabstrip.height,
      display: 'grid',
      minWidth: 0,
      fontSize: 14,
    }),
    btn: css({ display: 'grid', width: '100%', minWidth: 0 }),
    body: css({ display: 'grid', placeItems: 'center', color }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Button
        block
        theme={theme.name}
        active={!selected}
        style={styles.btn}
        onClick={() => props.onClick?.({ id })}
        onMouse={(e) => setOver(e.is.over)}
      >
        <div className={styles.body.class}>{item.label ?? item.id}</div>
      </Button>
    </div>
  );
};
