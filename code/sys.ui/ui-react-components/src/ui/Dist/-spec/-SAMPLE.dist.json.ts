import { type t } from '../common.ts';

/**
 * Realistic "hello world" distribution package.
 * Trimmed for dev harness sculpting (non-authoritative).
 */
export const HelloWorld: t.DistPkg = {
  type: 'https://jsr.io/@sys/types/0.0.199/src/types/t.Pkg.dist.ts' as t.StringTypeUrl,
  pkg: { name: '@scope/foobar', version: '0.0.0' },
  build: {
    time: 1766080079783,
    size: { total: 889372, pkg: 888698 },
    builder: '@sys/driver-vite@0.0.245',
    runtime: 'deno=2.6.1:v8=14.2.231.17-rusty:typescript=5.9.2',
  },

  entry: 'pkg/-entry.Bk8IHgcT.js',
  url: { base: '/' },
  hash: {
    digest: 'sha256-ebe77955804aafe17e3a2d6e8970bac52b44e33329ca81d1a96f4f43e83abe35',
    parts: {
      'index.html': `sha256-237bf73369464342ecde735fc719e09b2e61d72f796101890cdcee7efcd1bb18:size=530`,
      'pkg/-entry.Bk8IHgcT.js': `sha256-80a94474863636ac630efcf905332bad0880da06938511be5a315294214cd818:size=183502`,
      'pkg/-pkg.json': `sha256-0586a38182190c02b7f8d572a29e3fa7e3e568a337f1b699c40427ec6be18b74:size=44`,
      'pkg/m.M7BQ7hd4.js': `sha256-8a172564df784b530d0b84343d015d17e1d73a02095b9f62e44f4120b1726a87:size=274687`,
      'pkg/m.unRVfc_U.js': `sha256-4b0b6e83db91b3320bb6a2f8b819919ea702addf8d445e8107432881e3aa014a:size=160184`,
      'sw.js': `sha256-1673999ec36428ed0cbcad8df49abfc6a516488d26a576a4eaefd9be68b0a464:size=144`,
    },
  } as t.CompositeHash,
};

/**
 * Sample data
 */
export const SAMPLE = {
  HelloWorld,
} as const;
