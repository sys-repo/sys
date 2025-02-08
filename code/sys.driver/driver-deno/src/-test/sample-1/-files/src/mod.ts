// Root module.
import { slug } from './common.ts';
export const Foo = { id: slug() } as const;
