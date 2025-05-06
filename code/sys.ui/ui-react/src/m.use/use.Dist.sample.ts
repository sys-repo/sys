import { type t } from './common.ts';

export const sample: t.DistPkg = {
  type: 'https://jsr.io/@sample/foo',
  pkg: {
    name: 'sample',
    version: '0.0.0-sample.0',
  },
  build: {
    size: { total: 123456, pkg: 1234 },
  },
  entry: 'pkg/-entry.CsmS4pX8.js',
  hash: {
    digest: `sha256-0000000000000000000000000000000000000000000000000000000000000000`,
    parts: {
      'index.html': `sha256-73118ead01ff731394195389afe6b3fef53f366c92013f90d4098523ef783dc1`,
      'pkg/-entry.CsmS4pX8.js': `sha256-d7c1df2d1d7ccadd611582d340245b446930d9c552b9a6e390e573fcb8069281`,
      'pkg/-pkg.json': `sha256-5cb551c509271d47374b378e56b137f2c30b4ad629fa12836be67f2c896e4565`,
      'pkg/a.CzfbkkOd.svg': `sha256-03dc57becc131b98626bf145a3827966fec98f60e6c284bce7d73a0f137904b7`,
      'pkg/a.DytWQd0P.svg': `sha256-548482b24965277eadcafc4cb299c9b37f7a6583f7ec624dff76b7a4501022f1`,
      'pkg/a.ccVBcAen.css': `sha256-1d6d1a552eabe1df220ee93e445c4f5eb150fdfae998996cdf1f9c60d662c35b`,
      'pkg/m.2f5gzOW6.js': `sha256-5f08d0a5ed787b51ff0e3c8a140668b95fe77cfbabb9fa1b8df085029479bcf5`,
      'pkg/m.6enj-n6N.js': `sha256-3c1100938d2bb3674f3cb696df5b5096151115c024752f7401e84af9327c01d1`,
      'pkg/m.6tNfJC1I.js': `sha256-ae42722c296c1f201a48042a6eaeed858de98585c6d7e44114124b63d1dd5708`,
      'pkg/m.B07hVUpE.js': `sha256-ac6c000836d8e949047f0f367987c38ea81ef14e4963d1e722b291b0bd6ebda3`,
      'pkg/m.B0X5Tzpk.js': `sha256-c4131f76f53fdb76802f60bf7679ccd79a0e390c77b15e7f91b0508a99f954cb`,
    },
  },
};
