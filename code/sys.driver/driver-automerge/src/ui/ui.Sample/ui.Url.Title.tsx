import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, DEFAULTS, rx } from './common.ts';

export type UrlTitleProps = {
  url?: string;
  debug?: boolean;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const UrlTitle: React.FC<UrlTitleProps> = (props) => {
  const { url = '<none>' } = props;

  /**
   * Render:
   */
  const styles = {
    base: css({ display: 'grid', placeItems: 'center', fontSize: 12 }),
    body: css({ display: 'grid', gridAutoFlow: 'column', gridAutoColumns: 'auto', columnGap: 6 }),
    label: css({ opacity: 0.5, userSelect: 'none' }),
  };

  if (!url) return null;

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        <span className={styles.label.class}>{'sync-server:'}</span>
        <span>{`wss://${url}`}</span>
      </div>
    </div>
  );
};
