import type { t } from '../common.ts';

export const SAMPLE_FILES_MODES = ['none', 'short', 'long'];
export type SampleFilesMode = (typeof SAMPLE_FILES_MODES)[number];

/**
 * Sample data.
 */
export const SAMPLE = {
  HelloWorld(opts: { files?: SampleFilesMode } = {}): t.DistPkg {
    const files = opts.files ?? 'short';
    const parts = FILES_BY_MODE[files];
    return {
      ...HelloWorld,
      hash: { ...(HelloWorld.hash ?? {}), parts } as t.CompositeHash,
    };
  },
} as const;

export const FILES_NONE: t.CompositeHash['parts'] = {};

export const FILES_SHORT: t.CompositeHash['parts'] = {
  'index.html': `sha256-237bf73369464342ecde735fc719e09b2e61d72f796101890cdcee7efcd1bb18:size=530`,
  'pkg/-entry.Bk8IHgcT.js': `sha256-80a94474863636ac630efcf905332bad0880da06938511be5a315294214cd818:size=183502`,
  'pkg/-pkg.json': `sha256-0586a38182190c02b7f8d572a29e3fa7e3e568a337f1b699c40427ec6be18b74:size=44`,
  'pkg/m.M7BQ7hd4.js': `sha256-8a172564df784b530d0b84343d015d17e1d73a02095b9f62e44f4120b1726a87:size=274687`,
  'pkg/m.unRVfc_U.js': `sha256-4b0b6e83db91b3320bb6a2f8b819919ea702addf8d445e8107432881e3aa014a:size=160184`,
  'sw.js': `sha256-1673999ec36428ed0cbcad8df49abfc6a516488d26a576a4eaefd9be68b0a464:size=144`,
};

/**
 * Long sample: realistic, trimmed subset.
 * (Not authoritative; just enough surface area for Browser sculpting.)
 */
export const FILES_LONG: t.CompositeHash['parts'] = {
  'index.html': `sha256-237bf73369464342ecde735fc719e09b2e61d72f796101890cdcee7efcd1bb18:size=530`,
  'pkg/-entry.Bk8IHgcT.js': `sha256-80a94474863636ac630efcf905332bad0880da06938511be5a315294214cd818:size=183502`,
  'pkg/-pkg.json': `sha256-0586a38182190c02b7f8d572a29e3fa7e3e568a337f1b699c40427ec6be18b74:size=44`,
  'pkg/m.BlJyDEZ1.js': `sha256-9c7720d588709a73ba9defe59f61622b4357d8b97d514523f76dbd1077fbf201:size=31`,
  'pkg/m.C5uGijsn.js': `sha256-b044f908d7b0b337460f09c23ba7c872e6b1f7e6d56b82e0534c5b383346d9c6:size=118565`,
  'pkg/m.CTzdpw5X.js': `sha256-59cedf36fbec47675ae017426cce0c612e672fa0093d4379a065a19022f53eb5:size=7704`,
  'pkg/m.DLjUsTQM.js': `sha256-b504b3bb344303bccbc7aaf8c609c56332331d32941742cbc45c8dfc4c26b29c:size=1005`,
  'pkg/m.DPlogVuv.js': `sha256-5f9a4f10ba0d0b3975537c6219b9ef6ebaa8439e7475734f962f40ffcb928247:size=42551`,
  'pkg/m.DiDlH3nJ.js': `sha256-479858f0f61970c1fbde9c32b876cbaead74c58b0b95c76bff33fb479de006d1:size=28482`,
  'pkg/m.DnlYxCzl.js': `sha256-cb2f4a7271bb422292778aaafa5a4e64497373d60cc17ebc8f4feec66b002f81:size=407`,
  'pkg/m.M7BQ7hd4.js': `sha256-8a172564df784b530d0b84343d015d17e1d73a02095b9f62e44f4120b1726a87:size=274687`,
  'pkg/m.QFfb1CGc.js': `sha256-86827df5375711ad8fe39eaca6c0ee451b02a7047a1bebee2e188151312a21f7:size=3650`,
  'pkg/m.QdR7Rg3_.js': `sha256-5e71a9cb2bbe4592ff9cbe88008baa19b186b7c8544010e37209af8e47b74db4:size=1273`,
  'pkg/m.UPFPKnKw.js': `sha256-505e33ac8a98e8f3c0a66be7c75949dd10c8cba9b7ecb89fd3754237d73cd804:size=51437`,
  'pkg/m.fcrkst_X.js': `sha256-44a27dd351296edce583a660993935dd5934f92f81d368ec940660d0132758b1:size=6986`,
  'pkg/m.mmSyHBFV.js': `sha256-05c481b40ca8482183169592301aa857f30f8c958be7673c2206027fe0426fba:size=8190`,
  'pkg/m.unRVfc_U.js': `sha256-4b0b6e83db91b3320bb6a2f8b819919ea702addf8d445e8107432881e3aa014a:size=160184`,
  'sw.js': `sha256-1673999ec36428ed0cbcad8df49abfc6a516488d26a576a4eaefd9be68b0a464:size=144`,
};

const FILES_BY_MODE: Record<SampleFilesMode, t.CompositeHash['parts']> = {
  none: FILES_NONE,
  short: FILES_SHORT,
  long: FILES_LONG,
};

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
    hash: { policy: 'https://jsr.io/@sys/fs/0.0.225/src/m.Pkg/m.Pkg.Dist.ts' },
  },
  entry: 'pkg/-entry.Bk8IHgcT.js',
  url: { base: '/' },
  hash: {
    digest: 'sha256-ebe77955804aafe17e3a2d6e8970bac52b44e33329ca81d1a96f4f43e83abe35',
    parts: FILES_SHORT,
  } as t.CompositeHash,
};
