export type * as t from '../common/t.ts';

export { pkg } from '../pkg.ts';

export { c, Cli, stripAnsi } from '@sys/cli';
export { CompositeHash } from '@sys/crypto/hash';
export { DenoFile } from '@sys/driver-deno/runtime';
export { Fs, Path, Pkg } from '@sys/fs';
export { Http } from '@sys/http/server';
export { Net } from '@sys/net';
export { Process } from '@sys/process';
export { Time } from '@sys/std/time';
export { Url } from '@sys/std/url';
export { Is, Num } from '@sys/std/value';

export { ViteConfig } from '../m.vite.config/mod.ts';

/**
 * Constants.
 */
export const DEFAULTS = { port: 1234 } as const;
