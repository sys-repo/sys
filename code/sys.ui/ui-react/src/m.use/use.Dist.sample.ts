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
    builder: { name: '@sys/sample', version: '0.0.0' },
    runtime: 'deno=<version>:v8=<version>:typescript=<version>',
  },
  entry: 'pkg/-entry.CsmS4pX8.js',
  hash: {
    digest: `sha256-0000000000000000000000000000000000000000000000000000000000000000`,
    parts: {
      'index.html': `sha256-9629110785e01983cce73ef3c3f8e5a6900069123b92b3ac63f4d653674f13e6:size=537`,
      'pkg/-entry.BEgRUrsO.js': `sha256-3e12732ef86f9cdc62463533fdc4e7a34815c05407777c3eea48394eb41d3042:size=16`,
      'pkg/m.B2RI71A8.js': `sha256-98959e816d3bbec5875d19fc523fc7e9641272b80a0c62d3ddb34dbda273da86:size=12`,
      'pkg/m.DW3RxxEf.js': `sha256-43601688ba8a60f2f3858cf3368c8ce6393ab27b4cedd2c643c2c723193814fb:size=12`,
      'pkg/m.Du7RzsRq.js': `sha256-c0306ea8c45cf303877563c619c367436966a792a3d536d2a4bc38019fbea1f0:size=12`,
      'pkg/m.IecpGBwa.js': `sha256-78981db162de77a4b293d09883efdd5dbb7b8a9f87fc5a4c3aa2971ee40e934c:size=12`,
    },
  },
};
