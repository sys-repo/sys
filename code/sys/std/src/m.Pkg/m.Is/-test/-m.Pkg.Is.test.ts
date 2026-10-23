import { describe, expect, it, pkg, type t } from '../../../-test.ts';
import { Pkg } from '../../mod.ts';

const hash = `sha256-${'a'.repeat(64)}`;

/** Shape-only fixture: no cryptographic claim is made by Pkg.Is.dist. */
function manifest(): t.DistPkg {
  return {
    type: 'https://jsr.io/@sample/foo',
    pkg: { name: 'foo', version: '1.2.3' },
    build: {
      time: 1746520471244,
      size: { total: 1, pkg: 0 },
      builder: '@sys/driver-vite@0.0.0',
      runtime: '<runtime-uri>',
      hash: { policy: 'https://jsr.io/@sample/hash/0.0.1/src/hash.ts' },
    },
    hash: { scheme: 'sys.dist/v2', digest: hash, parts: { 'index.html': `${hash}:size=1` } },
  };
}

describe('Pkg.Is', () => {
  it('unknown and package shape guards', () => {
    const invalid: readonly unknown[] = [
      123,
      true,
      null,
      undefined,
      BigInt(0),
      Symbol('foo'),
      {},
      [],
    ];
    for (const value of invalid) {
      // @ts-expect-error Exercise invalid runtime input.
      expect(Pkg.Is.unknown(value)).to.eql(true);
      expect(Pkg.Is.pkg(value)).to.eql(false);
    }
    expect(Pkg.Is.unknown('<unknown>@0.0.0')).to.eql(true);
    expect(Pkg.Is.unknown({ name: '<unknown>', version: '0.0.0' })).to.eql(true);
    expect(Pkg.Is.unknown(Pkg.toString(pkg))).to.eql(false);
    expect(Pkg.Is.pkg({ name: 'foo', version: '1.2.3' })).to.eql(true);
  });

  it('dist guard is total for absent and partially shaped objects', () => {
    const invalid = [
      123,
      true,
      null,
      undefined,
      BigInt(0),
      Symbol('foo'),
      {},
      [],
      { type: 'x', build: {} },
      { type: 'x', build: {}, hash: null },
      { type: 'x', build: {}, hash: 0 },
    ];
    for (const value of invalid) expect(Pkg.Is.dist(value)).to.eql(false);
  });

  it('requires every typed build member before exposing an observation', () => {
    const value = manifest();
    for (const size of [undefined, null, [], {}, 1, 'size']) {
      const observed = Pkg.Is.dist({ ...value, build: { ...value.build, size } });
      expect(observed, 'build.size').to.eql(false);
    }
    for (const key of ['total', 'pkg']) {
      for (const member of [undefined, null, [], {}, '1', -1, 0.5, NaN, Infinity]) {
        const size = { ...value.build.size, [key]: member };
        const observed = Pkg.Is.dist({ ...value, build: { ...value.build, size } });
        expect(observed, `build.size.${key}`).to.eql(false);
      }
    }
    for (const time of [undefined, null, [], {}, 'now', NaN, Infinity]) {
      const observed = Pkg.Is.dist({ ...value, build: { ...value.build, time } });
      expect(observed, 'build.time').to.eql(false);
    }
    for (const key of ['builder', 'runtime']) {
      for (const member of [undefined, null, [], {}, 1]) {
        const build = { ...value.build, [key]: member };
        expect(Pkg.Is.dist({ ...value, build }), `build.${key}`).to.eql(false);
      }
    }
    // Shape-only metadata never has to equal independently verified payload statistics.
    const descriptive = { ...value, build: { ...value.build, size: { total: 0, pkg: 0 } } };
    expect(Pkg.Is.dist(descriptive)).to.eql(true);
  });

  it('recognizes the supported shape, with or without descriptive root pkg', () => {
    const value = manifest();
    expect(Pkg.Is.dist(value)).to.eql(true);
    delete value.pkg;
    expect(Pkg.Is.dist(value)).to.eql(true);
    value.build.sign = { path: '../sidecar.sig', scheme: 'Ed25519', key: 'kid:sample' };
    expect(Pkg.Is.dist(value)).to.eql(true);
    value.build.hash.ignore = { format: 'gitignore', rules: ['*.map'], 'rules:digest': hash };
    expect(Pkg.Is.dist(value)).to.eql(true);
  });

  it('structural observations → retain prototype and optional-metadata acceptance', () => {
    const value = manifest();
    if (!value.pkg) throw new Error('Expected fixture package metadata.');
    const observations: unknown[] = [
      Object.create(value),
      Object.assign([], value),
      { ...value, build: Object.assign([], value.build) },
      { ...value, hash: Object.assign([], value.hash) },
      { ...value, build: { ...value.build, sign: undefined } },
      { ...value, build: { ...value.build, hash: { ...value.build.hash, ignore: undefined } } },
    ];
    for (const observation of observations) expect(Pkg.Is.dist(observation)).to.eql(true);
    expect(Pkg.Is.pkg(Object.create(value.pkg))).to.eql(true);
    expect(Pkg.Is.pkg(Object.assign([], value.pkg))).to.eql(true);
  });

  it('rejects missing/unsupported schemes and empty inventories without conversion', () => {
    const value = manifest();
    for (const scheme of [undefined, 'sys.dist/v1', 'sys.dist/v3']) {
      expect(Pkg.Is.dist({ ...value, hash: { ...value.hash, scheme } })).to.eql(false);
    }
    expect(Pkg.Is.dist({ ...value, hash: { ...value.hash, parts: {} } })).to.eql(false);
    const { hash: _descriptiveHash, ...build } = value.build;
    expect(Pkg.Is.dist({ ...value, build })).to.eql(false);
  });

  it('requires complete canonical part parses including lengths', () => {
    const value = manifest();
    const invalid = [
      hash,
      `${hash}:size=`,
      `${hash}:size=-1`,
      `${hash}:size=01`,
      `${hash}:size=1.5`,
      `${hash}:size=9007199254740992`,
      `${hash}:size=12kb`,
      `${hash}:SIZE=12`,
    ];
    for (const part of invalid) {
      expect(Pkg.Is.dist({ ...value, hash: { ...value.hash, parts: { 'index.html': part } } }))
        .to.eql(false);
    }
    expect(Pkg.Is.dist({
      ...value,
      hash: { ...value.hash, parts: { 'index.html': `${hash}:size=0` } },
    })).to.eql(true);
  });

  it('checks descriptive shapes without interpreting their policy or signature hints', () => {
    const value = manifest();
    const invalid = [
      { path: 'dist.json.sig', scheme: 'RSA' },
      { path: 123, scheme: 'Ed25519' },
      { path: 'dist.json.sig', scheme: 'Ed25519', key: 123 },
    ];
    for (const sign of invalid) {
      expect(Pkg.Is.dist({ ...value, build: { ...value.build, sign } })).to.eql(false);
    }
    expect(Pkg.Is.dist({
      ...value,
      build: { ...value.build, hash: { policy: 'x', ignore: { format: 'glob', rules: [] } } },
    })).to.eql(false);
  });
});
