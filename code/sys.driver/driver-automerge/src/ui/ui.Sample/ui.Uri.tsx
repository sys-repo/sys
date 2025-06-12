import React from 'react';
import { type t, css } from './common.ts';

export type UriProps = {
  prefix?: string;
  text?: string;
  suffix?: string;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Uri: React.FC<UriProps> = (props) => {
  const { prefix, suffix } = props;
  const text = wrangle.text(props.text);

  /**
   * Render:
   */
  const styles = {
    base: css({
      display: 'grid',
      gridAutoFlow: 'column',
      gridAutoColumns: 'auto',
      columnGap: 2,
    }),
  };

  if (!text) return null;

  const elParts = text.parts.map((part, i, items) => {
    const isFirst = i === 0;
    const isLast = i === items.length - 1;
    const opacity = isLast ? 1 : 0.5;
    return (
      <React.Fragment key={i}>
        {!isFirst && <span style={{ opacity: 0.5 }}>{':'}</span>}
        <span style={{ opacity }}>{part}</span>
      </React.Fragment>
    );
  });

  return (
    <div className={css(styles.base, props.style).class}>
      {prefix && <span>{prefix}</span>}
      {elParts}
      {suffix && <span>{suffix}</span>}
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  text(text: string = '') {
    text = text.trim();
    if (!text) return;
    return { parts: text.split(':'), toString: () => text };
  },
} as const;
