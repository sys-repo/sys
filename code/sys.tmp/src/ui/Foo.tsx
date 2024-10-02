import type { FC } from 'react';
import { Pkg } from '../common.ts';

/**
 * Sample Component.
 */
export type FooProps = { enabled?: boolean };
export const Foo: FC<FooProps> = (_props = {}) => {
  const text = `${Pkg.name}@${Pkg.version}:Foo`;

  /**
   * TODO 🐷 figure out JSX.Intrinsics (intellisense).
   */
  // @ts-ignore: JSX.Intrinsics not found (yet).
  return <code>{text}</code>;
};
