import React from 'react';
import { type t, Button, Color, css, Obj, Str } from './common.ts';

/**
 * Component:
 */
export const PathView: React.FC<t.PathViewProps> = (props) => {
  const { path = [], prefix, maxSegmentLength = 20 } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);

  const segBtnBase = {
    lineHeight: 1.2,
    padding: '0 6px',
    height: 16,
    alignSelf: 'center',
  } as const;

  const styles = {
    base: css({
      color: Color.alpha(theme.fg, 0.5),
      fontSize: 10,
      fontFamily: 'monospace',
      cursor: 'default',
      display: 'grid',
      justifyItems: 'start',
    }),
    body: css({ display: 'grid', gridAutoFlow: 'column', columnGap: 4 }),
    prefix: css({ marginRight: 4, color: props.prefixColor, userSelect: 'none' }),
    divider: css({ color: Color.alpha(theme.fg, 0.25) }),
    last: css({ color: theme.fg }),
    empty: css({ opacity: 0.5 }),
    segBtn: css(segBtnBase, { opacity: 0.85 }),
    segBtnLast: css(segBtnBase, { opacity: 1 }),
  };

  const elPath = path.map((segment, i, { length }) => {
    const last = i >= length - 1;
    const seg = Str.truncate(String(segment), maxSegmentLength);

    const onClick = () => {
      if (!props.onClick) return; // no handler → no-op
      const full = path as t.ObjectPath;
      const at = Obj.Path.slice(full, 0, i + 1);
      props.onClick({
        kind: 'segment',
        path: { full, at, atIndex: i, atKey: segment },
      });
    };

    return (
      <React.Fragment key={i}>
        <Button
          label={seg}
          style={last ? styles.segBtnLast : styles.segBtn}
          theme={theme.name}
          active={!!props.onClick}
          onClick={onClick}
        />
        {!last && <span className={styles.divider.class}>/</span>}
      </React.Fragment>
    );
  });

  const emptyText = !!props.prefix ? '<none>' : 'path: <none>';
  const elEmpty = <div className={styles.empty.class}>{emptyText}</div>;
  const elPrefix = prefix && <div className={styles.prefix.class}>{prefix}</div>;

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        {elPrefix} {path.length === 0 ? elEmpty : elPath}
      </div>
    </div>
  );
};
