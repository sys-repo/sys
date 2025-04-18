import React from 'react';
import { type t, Color, css, Icons, ReactString } from './common.ts';

type P = t.TooSmallProps;

export const TooSmall: React.FC<P> = (props) => {
  const {} = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      userSelect: 'none',
      Padding: [20, 40],
      fontSize: 16,
      display: 'grid',
      placeItems: 'center',
    }),
    body: css({ display: 'grid', gridTemplateRows: 'auto auto', rowGap: '1em', lineHeight: 1.5 }),
    header: css({ display: 'grid', placeItems: 'center' }),
    children: css({ textAlign: 'center' }),
  };

  const elHeader = (
    <div className={styles.header.class}>
      <Icons.ProjectorScreen size={50} />
    </div>
  );

  const elBody = <div className={styles.children.class}>{wrangle.body(props.children)}</div>;

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        {elHeader}
        {elBody}
      </div>
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  body(children?: t.ReactNode): t.ReactNode {
    if (!children) return wrangle.body('Please make your window bigger.');
    if (typeof children === 'string') return ReactString.break(children);
    return children;
  },
} as const;
