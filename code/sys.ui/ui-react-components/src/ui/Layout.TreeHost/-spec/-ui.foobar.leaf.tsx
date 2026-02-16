import React from 'react';
import { type t, Style, Color, css, ObjectView } from './common.ts';

export type FooLeafProps = {
  title?: string;
  node: t.TreeHostViewNode;
  path: t.ObjectPath;
  padding?: t.CssPaddingInput;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

export const FooLeaf: React.FC<FooLeafProps> = (props) => {
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      fontSize: 14,
      display: 'grid',
      ...Style.toPadding(props.padding ?? 8),
    }),
    body: css({
      backgroundColor: Color.ruby(0.1),
      border: `dashed 1px ${Color.alpha(theme.fg, 0.3)}`,
      borderRadius: 8,
      Padding: [10, 12],
      display: 'grid',
      minHeight: 0,
      alignSelf: 'stretch',
      alignContent: 'start',
      gridAutoFlow: 'row',
      gridAutoRows: 'min-content',
      rowGap: 5,
    }),
    obj: css({
      marginLeft: 20,
      marginBottom: 10,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        <div>
          {'🌳'} {props.title ?? `Leaf Panel`}
        </div>
        <ObjectView
          theme={theme.name}
          name={'t.TreeHostLeaf'}
          data={{ path: props.path, node: props.node }}
          expand={1}
          style={styles.obj}
        />
      </div>
    </div>
  );
};
