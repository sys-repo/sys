/**
 * @module
 */
import { type t } from './common.ts';
import { FooSample as Foo } from './-ui.foobar.tsx';

export const Sample = {
  Foo,
  create: (title: t.ReactNode) => ({ ...Foo, title: title }),
} as const;
