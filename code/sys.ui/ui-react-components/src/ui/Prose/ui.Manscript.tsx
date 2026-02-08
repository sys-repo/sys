import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, D, Rx, Obj, Str, Is } from './common.ts';
import { useScopedStyles } from './use.Styles.ts';

type P = t.Prose.Manuscript.Props;

/**
 * Component:
 */
export const Manuscript: React.FC<P> = (props) => {
  const { debug = false } = props;
  const { componentAttr } = useScopedStyles(props); // ← 🐷 delete if not using CSS scoped styles.

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      // display: 'grid',
      padding: 10,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class} data-component={componentAttr}>
      <div>{`🐷 Manuscript`}</div>
      <div>
        <h1>H1 Title</h1>
        {Str.Lorem.words(20)}
        <code>foo.bar</code>
        {Str.Lorem.words(10)}
      </div>
    </div>
  );
};
