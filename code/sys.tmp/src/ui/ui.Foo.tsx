// @ts-types="@types/react"
import React from 'react';

import { css } from '@sys/ui-css';
import { pkg } from '../pkg.ts';

/** Constants. */
export const RED = 'rgba(255, 0, 0, 0.1)'; /* RED */

/**
 * Sample properties.
 */
export type FooProps = {
  enabled?: boolean;
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
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
    }),
  };

  if (!enabled) text += ' (disabled)';
  return (
    <div className={styles.base.class}>
      <code>{text}</code>
    </div>
  );
};
