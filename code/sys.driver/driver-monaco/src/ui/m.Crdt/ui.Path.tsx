import React from 'react';
import { type t, Color, css } from './common.ts';

/**
 * Component:
 */
export const PathView: React.FC<t.PathViewProps> = (props) => {
  const { path = [], prefix } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: Color.alpha(theme.fg, 0.5),
      fontSize: 10,
      fontFamily: 'monospace',
      display: 'grid',
      justifyItems: 'start',
    }),
    body: css({ display: 'grid', gridAutoFlow: 'column', columnGap: 4 }),
    prefix: css({
      marginRight: 4,
      color: props.prefixColor,
    }),
    divider: css({ color: Color.alpha(theme.fg, 0.25) }),
    last: css({ color: theme.fg }),
  };

  const elPath = path.map((slot, i, { length }) => {
    const last = i >= length - 1;
    const cn = last ? styles.last.class : undefined;
    return (
      <React.Fragment key={i}>
        <span className={cn}>{slot}</span>
        {!last && <span className={styles.divider.class}>/</span>}
      </React.Fragment>
    );
  });

  const elPrefix = prefix && <div className={styles.prefix.class}>{prefix}</div>;

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        {elPrefix} {elPath}
      </div>
    </div>
  );
};
