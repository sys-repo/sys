import { type t } from './common.ts';

export const sample: t.DistPkg = {
  type: 'https://jsr.io/@sample/foo/src/type.ts',
  pkg: {
    name: 'sample',
    version: '0.0.0-sample.0',
  },
  build: {
    time: 1746521593787,
    size: { total: 0, pkg: 0 },
    builder: '@scope/sample@0.0.0',
    runtime: 'deno=<version>:v8=<version>:typescript=<version>',
  },
  entry: 'pkg/-entry.CsmS4pX8.js',
  url: { base: '/' },
  hash: {
    digest: `sha256-0000000000000000000000000000000000000000000000000000000000000000`,
    parts: {
      'index.html': `sha256-0000000000000000000000000000000000000000000000000000000000000000:size=0`,
      'pkg/-entry.BEgRUrsO.js': `sha256-0000000000000000000000000000000000000000000000000000000000000000:size=0`,
      'pkg/m.B2RI71A8.js': `sha256-0000000000000000000000000000000000000000000000000000000000000000:size=0`,
      'pkg/m.DW3RxxEf.js': `sha256-0000000000000000000000000000000000000000000000000000000000000000:size=0`,
      'pkg/m.Du7RzsRq.js': `sha256-0000000000000000000000000000000000000000000000000000000000000000:size=0`,
      'pkg/m.IecpGBwa.js': `sha256-0000000000000000000000000000000000000000000000000000000000000000:size=0`,
    },
  },
};
