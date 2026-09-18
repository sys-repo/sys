import { Fs } from '../src/common.ts';
export * from '../src/common.ts';
export type * as t from './t.ts';

// Keep task-specific CLI/driver entrypoints local: re-exports load in every script.
export { c, Fmt, stripAnsi, Text } from '@sys/cli/fmt';
export { HashFmt } from '@sys/crypto/fmt';
export { Hash } from '@sys/crypto/hash';
export { Env } from '@sys/fs/env';
export { MediaType } from '@sys/std/media-type';

export const ROOT = Fs.Path.fromFileUrl(new URL('../', import.meta.url));
