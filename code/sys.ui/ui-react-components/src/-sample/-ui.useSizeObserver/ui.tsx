import React from 'react';
import { type t, css, useSizeObserver } from '../-test.ui.ts';

export type SampleProps = {
  style?: t.CssInput;
};

type P = SampleProps;

/**
 * Component:
 */
export const Sample: React.FC<P> = (props) => {
  const {} = props;

  const size = useSizeObserver();

  console.log('size.rect', size.rect);

  /**
   * Render:
   */
  const styles = {
    base: css({ padding: 10 }),
  };
  return (
    <div ref={size.ref} className={css(styles.base, props.style).class}>
      <div>{'👋 Hello'}</div>
    </div>
  );
};
