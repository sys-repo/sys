import React from 'react';
import { type t, Color, css, SplitPane, Tree } from './common.ts';

export const LayoutTreeSplit: React.FC<t.LayoutTreeSplitProps> = (props) => {
  const { debug = false, children } = props;

  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      display: 'grid',
      minWidth: 0,
      minHeight: 0,
      color: theme.fg,
      backgroundColor: debug ? Color.ruby(0.04) : undefined,
    }),
    placeholder: css({
      minHeight: 120,
      display: 'grid',
      placeItems: 'center',
      color: theme.fg,
      opacity: 0.65,
      fontSize: 13,
    }),
    content: css({
      display: 'grid',
      minWidth: 0,
      minHeight: 0,
    }),
  };

  // NOTE: Tree.Index public surface not available here; using View temporarily (Phase-1).
  const treePane = <Tree.Index.View root={[]} />;
  const contentPane = children ? (
    <div className={styles.content.class}>{children}</div>
  ) : (
    <div className={styles.placeholder.class}>{'No content selected.'}</div>
  );

  return (
    <div className={css(styles.base, props.style).class} data-component={'LayoutTreeSplit'}>
      <SplitPane debug={debug} theme={theme.name} orientation={'horizontal'}>
        {treePane}
        {contentPane}
      </SplitPane>
    </div>
  );
};
