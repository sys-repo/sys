import React, { useEffect, useRef } from 'react';
import { type t, Color, css, D, Obj, SplitPane } from './common.ts';
import { findViewNode } from './u.data.findViewNode.ts';
import { Nav } from './ui.Nav.tsx';
import { Main } from './ui.slot.Main.tsx';

export const TreeHost: React.FC<t.TreeHostProps> = (props) => {
  const { debug = false, split = D.split, slots = {} } = props;
  const prevPath = useRef<t.ObjectPath | undefined>(undefined);

  useEffect(() => {
    const tree = props.tree;
    if (!tree) return;

    const next = props.selectedPath ?? [];
    const prev = prevPath.current ?? [];
    if (Obj.Path.eql(prev, next)) return;

    prevPath.current = next;

    const node = findViewNode(tree, next);
    const is = { leaf: node ? !(Array.isArray(node.children) && node.children.length > 0) : false };
    props.onSelectionChange?.({ tree, path: next, node, is });
  }, [props.tree, props.selectedPath, props.onSelectionChange]);

  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      display: 'grid',
      minWidth: 0,
      minHeight: 0,
      color: theme.fg,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class} data-component={D.displayName}>
      <SplitPane
        debug={debug}
        theme={theme.name}
        active={false}
        orientation={'horizontal'}
        value={split}
        onChange={(e) => props.onSplitChange?.({ split: e.ratios })}
      >
        <Nav {...props} />
        <Main {...props} />
      </SplitPane>
    </div>
  );
};
