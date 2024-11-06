import type { FC } from 'react';
import { pkg } from '../common.ts';

/**
 * Sample component properties.
 */
export type FooProps = { enabled?: boolean };

/**
 * Sample component.
 */
export const Foo: FC<FooProps> = (_props = {}) => {
  const text = `${pkg.name}@${pkg.version}:Foo`;
  return <code>{text}</code>;
};
