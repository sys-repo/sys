import type { FC } from 'react';
import { Pkg } from '../common.ts';

export type FooProps = {
  enabled?: boolean;
};

/**
 * Sample Component.
 */
export const Foo: FC<FooProps> = (_props = {}) => {
  const text = `${Pkg.name}@${Pkg.version}:Foo`;
  // @ts-ignore: JSX.Intrinsics not found (yet).
  return <code>{text}</code>;
};
