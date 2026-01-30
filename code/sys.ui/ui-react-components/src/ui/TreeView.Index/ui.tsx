import React from 'react';

import { type t, Color, css, D, Data, IndexTreeViewItem, Obj } from './common.ts';
import { SlideDeck } from './u.SlideDeck.tsx';
import { renderItems } from './ui.items.tsx';
import { Spinning } from './ui.Spinning.tsx';

export const IndexTreeView: React.FC<t.IndexTreeViewProps> = (props) => {
  const { debug = false, minWidth, root, spinning = false } = props;

  // Normalize root → list; then drill to `path`.
  const rootList = React.useMemo(() => Data.toList(root), [root]);
  const path = (props.path ?? []) as t.ObjectPath;
  const pathKey = Obj.Path.encode(path);
  const view = React.useMemo(() => Data.viewAt(rootList, path), [rootList, pathKey]);

  // Determine slide direction from path depth delta.
  const prevPathRef = React.useRef<t.ObjectPath>(path);
  const prev = prevPathRef.current;
  const depthDelta = path.length - prev.length;
  const dir: -1 | 0 | 1 = depthDelta > 0 ? 1 : depthDelta < 0 ? -1 : 0;
  React.useEffect(() => void (prevPathRef.current = path), [path]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg }),
    spinning: css({ Absolute: 0 }),
    body: css({
      minWidth: minWidth ?? D.minWidth,
      pointerEvents: spinning ? 'none' : 'auto',
      filter: `blur(${spinning ? 0.8 : 0}px)`,
      opacity: spinning ? 0.06 : 1,
      transition: 'opacity 120ms ease',
    }),
  };

  const animKey = Obj.Path.encode(path);

  return (
    <div className={css(styles.base, props.style).class}>
      <SlideDeck
        keyId={animKey}
        direction={dir}
        style={styles.body}
        duration={props.slideDuration}
        offset={props.slideOffset}
      >
        {renderItems(props, view)}
      </SlideDeck>
      {spinning && <Spinning theme={theme.name} style={styles.spinning} />}
    </div>
  );
};
