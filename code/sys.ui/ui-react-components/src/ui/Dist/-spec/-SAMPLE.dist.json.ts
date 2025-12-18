import { type t, Time } from '../common.ts';

/**
 * Minimal "hello world" distribution package.
 * Hard-coded, non-authoritative, for dev harness use only.
 */
export const HELLO_WORLD: t.DistPkg = {
  type: 'urn:sys:dist:pkg' as t.StringTypeUrl,

  pkg: {
    name: '@sys/hello-world',
    version: '0.0.0',
  } as t.Pkg,

  build: {
    time: Time.now.timestamp,
    size: { total: 0, pkg: 0 },
    builder: '@sys/builder@0.0.0' as t.StringPkgNameVer,
    runtime: 'urn:runtime:dev' as t.StringUri,
  },

  entry: 'mod.ts' as t.StringPath,

  url: {
    base: '/',
  },

  hash: {} as t.CompositeHash,
};

export const SAMPLE = {
  HELLO_WORLD,
} as const;
