export type * as t from './t.ts';

export * from '../common.ts';

export { Fs } from '@sys/fs';
export { Ignore } from '@sys/std/ignore';

export const DEFAULT_IGNORE = ['node_modules', '.git', '.DS_Store', '.tmp'] as const;
