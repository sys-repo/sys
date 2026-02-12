import React from 'react';
import { type t, Color, css, D } from './common.ts';
import { Tab } from './ui.Tab.tsx';

type P = t.Tabs.Props;

/**
 * Component:
 */
export const TabStrip: React.FC<P> = (props) => {
  const { items = [] } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const strip = props.parts?.strip;
  const border = strip?.border ?? true;
  const styles = {
    base: css({
      color: theme.fg,
      height: strip?.height ?? D.Tabstrip.height,
      borderBottom: border ? `solid 1px ${Color.alpha(theme.fg, 0.1)}` : undefined,
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
            theme={theme.name}
            key={item.id}
            item={item}
            selected={item.id === props.value}
            tabStyle={props.parts?.tab}
            onClick={props.onChange}
          />
        );
      })}
    </div>
  );
};
