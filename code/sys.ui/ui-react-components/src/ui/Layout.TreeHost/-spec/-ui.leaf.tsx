import React from 'react';
import { type t, Color, css, ObjectView } from './common.ts';

export type LeafPanelProps = {
  title?: string;
  node: t.TreeHostViewNode;
  path: t.ObjectPath;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

export const LeafPanel: React.FC<LeafPanelProps> = (props) => {
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
      Padding: 8,
      minHeight: 0,
    }),
    body: css({
      backgroundColor: Color.ruby(0.1),
      border: `dashed 1px ${Color.alpha(theme.fg, 0.3)}`,
      borderRadius: 8,
      Padding: [10, 12],
      display: 'grid',
      minHeight: 0,
      alignContent: 'start',
      gridAutoFlow: 'row',
      gridAutoRows: 'min-content',
      rowGap: 8,
    }),
    obj: css({ marginLeft: 6, marginBottom: 10 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        <div>{props.title ?? `🌳 Leaf Panel`}</div>
        <ObjectView
          theme={theme.name}
          name={'t.TreeHostLeaf'}
          data={{ path: props.path, node: props.node }}
          fontSize={11}
          expand={1}
          style={styles.obj}
        />
      </div>
    </div>
  );
};
