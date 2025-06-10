import React from 'react';
import { type t, Color, css, ObjectView } from './common.ts';

export const Sample: React.FC<t.SampleProps> = (props) => {
  const { debug = false, repo } = props;
  const peerId = wrangle.peerId(repo?.id.peer);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', color: theme.fg, padding: 10 }),
    peerId: css({
      Absolute: [null, 10, -23, null],
      fontSize: 11,
      display: 'grid',
      gridAutoFlow: 'column',
      gridAutoColumns: 'auto',
      columnGap: 3,
    }),
  };

  const elPeer = peerId && (
    <div className={styles.peerId.class}>
      {peerId.parts.map((part, i) => {
        const isFirst = i === 0;
        const isLast = i === peerId.parts.length - 1;
        const opacity = isLast ? 1 : 0.3;
        return (
          <React.Fragment key={i}>
            {!isFirst && <span>{':'}</span>}
            <span style={{ opacity }}>{part}</span>
          </React.Fragment>
        );
      })}
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elPeer}
      <ObjectView
        name={'T:SampleDoc'}
        data={props.doc}
        expand={1}
        fontSize={24}
        theme={theme.name}
      />
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  peerId(text: string = '') {
    text = text.trim();
    if (!text) return;
    return {
      parts: text.split(':'),
      toString: () => text,
    };
  },
} as const;
