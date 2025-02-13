// @ts-types="@types/react"
import React from 'react';
import { type t, Color, css, pkg } from './common.ts';

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

  const styles = {
    base: css({
      display: 'inline-block',
      backgroundColor: Color.RUBY,
    }),
  };

  if (!enabled) text += ' (disabled)';
  return (
    <div className={styles.base.class}>
      <code>{text}</code>
    </div>
  );
};
