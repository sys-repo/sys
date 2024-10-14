import type { FC } from 'react';
import { Pkg } from '../common.ts';

/**
 * Sample component properties.
 */
export type FooProps = { enabled?: boolean };

/**
 * Sample component.
 */
export const Foo: FC<FooProps> = (_props = {}) => {
  const text = `${Pkg.name}@${Pkg.version}:Foo`;
  return <code>{text}</code>;
};
