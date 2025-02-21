// @ts-types="@types/react"
import React from 'react';
import { type t, css, pkg } from './common.ts';

/**
 * Sample properties.
 */
export type FooProps = {
  enabled?: boolean;
  style?: t.CssValue;
};

/**
 * Component (UI).
 */
export const Foo: React.FC<FooProps> = (props) => {
  const { enabled = true } = props;
  let text = `${pkg.name}@${pkg.version}/ui:<Foo>`;

  const [isOver, setOver] = React.useState(false);
  const over = (isOver: boolean) => () => setOver(isOver);

  const styles = {
    base: css({
      display: 'inline-block',
      backgroundColor: `rgba(255, 0, 0, ${isOver ? 0.9 : 0.3})` /* RED */,
    }),
  };

  if (!enabled) text += ' (disabled)';
  return (
    <div className={styles.base.class} onMouseEnter={over(true)} onMouseLeave={over(false)}>
      <code>{text}</code>
    </div>
  );
};
