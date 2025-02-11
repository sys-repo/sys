// @ts-types="@types/react"
import React from 'react';
import { pkg } from '../pkg.ts';

/** Constants. */
export const RED = 'rgba(255, 0, 0, 0.1)'; /* RED */

/**
 * Sample component properties.
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
  if (!enabled) text += ' (disabled)';
  return <code style={{ backgroundColor: RED }}>{text}</code>;
};
