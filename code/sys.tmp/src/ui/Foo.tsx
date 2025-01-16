// @ts-types="@types/react"
import React from 'react';
import { pkg } from './common.ts';

/**
 * Sample component properties.
 */
export type FooProps = { enabled?: boolean };

/**
 * Sample component.
 */
export const Foo: React.FC<FooProps> = (props) => {
  const { enabled = true } = props;
  let text = `${pkg.name}@${pkg.version}/ui:<Foo>`;
  if (!enabled) text += ' (disabled)';
  return <code>{text}</code>;
};
