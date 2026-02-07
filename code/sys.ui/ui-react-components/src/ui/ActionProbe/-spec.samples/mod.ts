/**
 * @module
 */
import { type t } from '../common.ts';
import { FooSample as Foo } from './u.foo.tsx';

export const Sample = {
  Foo,
  create: (title: t.ReactNode) => ({ ...Foo, title: title }),
} as const;
