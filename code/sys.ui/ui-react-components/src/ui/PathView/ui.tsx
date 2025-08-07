import React from 'react';
import { type t, Color, css, Str } from './common.ts';

/**
 * Component:
 */
export const PathView: React.FC<t.PathViewProps> = (props) => {
  const { path = [], prefix, maxSegmentLength = 20 } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
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
  };

  const elPath = path.map((segment, i, { length }) => {
    const last = i >= length - 1;
    const cn = last ? styles.last.class : undefined;
    const seg = Str.truncate(String(segment), maxSegmentLength);
    return (
      <React.Fragment key={i}>
        <span className={cn}>{seg}</span>
        {!last && <span className={styles.divider.class}>/</span>}
      </React.Fragment>
    );
  });

  const emptyText = !!props.prefix ? '<empty>' : 'path: <empty>';
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
