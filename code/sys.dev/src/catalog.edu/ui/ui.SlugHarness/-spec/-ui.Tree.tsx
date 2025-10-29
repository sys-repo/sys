import { IndexTree } from '@sys/ui-react-components';
import React, { useEffect, useRef, useState } from 'react';
import { Icons } from '../../ui.Icons.ts';
import { type t, Button, Color, Crdt, css, D, Obj, Rx, Signal } from '../common.ts';
import { PATH } from './-u.ts';
import { toTreeStructure } from './-ui.Tree.u.ts';

const Path = Obj.Path;

export type TreeProps = {
  ctx: t.SlugViewProps;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Tree: React.FC<TreeProps> = (props) => {
  const { debug = false, ctx } = props;
  const doc = ctx.doc;

  /**
   * Hooks:
   */
  const [root, setRoot] = React.useState<t.TreeNodeList | undefined>();
  const [path, setPath] = React.useState<t.ObjectPath | undefined>();

  /**
   * Effects:
   */
  React.useEffect(() => {
    const reset = () => void setRoot(undefined);
    if (!doc) return reset();

    const updateTree = () => {
      const parsed = (doc.current as any)?.['yaml.parsed']; // TEMP 🐷 hard-coded!
      if (!parsed) return reset();
      const prog = ((parsed ?? {}) as any).slug?.data['programme-v1']; // 🐷
      setRoot(toTreeStructure(prog));
    };
    updateTree();

    function updatePath() {
      if (!doc) return;
      const p = Obj.Path.get(doc.current, Path.join(PATH.dev, PATH.selectedPath));
      setPath(p as any);
    }

    const ev = doc.events();
    ev.$.subscribe(updateTree);

    ev.path(Path.join(PATH.dev, PATH.selectedPath)).$.subscribe((e) => {
      updatePath();
    });
    updatePath();

    return ev.dispose;
  }, [doc?.instance, doc?.id]);

  // const m = IndexTree.Data.Yaml.from()

  /**
   * Handlers:
   */
  function handleClick(path?: t.ObjectPath) {
    doc?.change((d) => {
      Path.Mutate.ensure(d, PATH.dev, {});
      Path.Mutate.set(d, Path.join(PATH.dev, PATH.selectedPath), path ?? null);
    });
  }

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
      color: theme.fg,
      minWidth: 330,
      minHeight: 450,
      display: 'grid',
    }),
    back: css({
      Absolute: [-32, null, null, -32],
    }),
  };

  const elBackButton = (
    <Button
      theme={theme.name}
      style={styles.back}
      enabled={(path ?? []).length > 0}
      onClick={() => {
        if (!path) return;
        const next = path.slice(0, -1);
        console.log('next', next);
        handleClick(next);
      }}
    >
      <Icons.Arrow.Left />
    </Button>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <IndexTree.View
        theme={theme.name}
        root={root}
        path={path}
        onPressDown={(e) => {
          console.log('click', e);
          if (e.hasChildren) handleClick(e.node.path);
        }}
      />
      {elBackButton}
    </div>
  );
};
