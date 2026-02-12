import React from 'react';
import { type t, Color, css, ObjectView } from './common.ts';

export type FooProps = {
  tab: t.Tabs.Item;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Foo: React.FC<FooProps> = (props) => {
  const { debug = false, tab } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      userSelect: 'none',
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
    }),
  };

  const name = `item:${tab.id}`;
  const data = {
    tab,
    items: Array.from({ length: 50 }).map((_, i) => `item-${i + 1}`),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <ObjectView theme={theme.name} data={data} name={name} expand={1} />
    </div>
  );
};
