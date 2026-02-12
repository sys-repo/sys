import React from 'react';
import { type t, Color, css, D } from './common.ts';
import { Tab } from './ui.Tab.tsx';

type P = t.Tabs.Props;

/**
 * Component:
 */
export const TabStrip: React.FC<P> = (props) => {
  const { debug = false, items = [] } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      height: D.Tabstrip.height,
      borderBottom: `solid 1px ${Color.alpha(theme.fg, 0.1)}`,
      display: 'grid',
      alignItems: 'stretch',
      gridTemplateColumns: `repeat(${items.length || 1}, minmax(0, 1fr))`,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      {items.map((item) => {
        return (
          <Tab
            key={item.id}
            item={item}
            selected={item.id === props.value}
            theme={theme.name}
            onClick={props.onChange}
          />
        );
      })}
    </div>
  );
};
