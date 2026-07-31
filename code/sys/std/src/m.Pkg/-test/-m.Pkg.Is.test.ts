import { type t, describe, expect, it, pkg } from '../../-test.ts';
import { Pkg } from '../mod.ts';

describe('Pkg.Is', () => {
  describe('Is.unknown', () => {
    it('true (unknown)', () => {
      const NON = [123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((v: any) => {
        expect(Pkg.Is.unknown(v)).to.eql(true, v);
      });
      expect(Pkg.Is.unknown('<unknown>@0.0.0')).to.eql(true);
      expect(Pkg.Is.unknown({ name: '<unknown>', version: '0.0.0' })).to.eql(true);
    });

    it('false (known)', () => {
      expect(Pkg.Is.unknown(Pkg.toString(pkg))).to.eql(false);
    });
  });

  describe('Is.pkg', () => {
    it('false', () => {
      const NON = [123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((v: any) => {
        expect(Pkg.Is.pkg(v)).to.eql(false, v);
      });
    });

    it('true', () => {
      const pkg: t.Pkg = { name: 'foo', version: '1.2.3' };
      expect(Pkg.Is.pkg(pkg)).to.eql(true);
    });
  });

  describe('Is.dist', () => {
    it('false', () => {
      const NON = [123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((v: any) => {
        expect(Pkg.Is.dist(v)).to.eql(false, v);
      });
    });

    it('false: missing build.hash.policy', () => {
      const dist: any = {
        type: 'https://jsr.io/@sample/foo',
        pkg: { name: 'foo', version: '1.2.3' },
        build: {
          time: 1746520471244,
          size: { total: 123_456, pkg: 123 },
          builder: '@sys/driver-vite@0.0.0',
          runtime: '<runtime-uri>',
        },
        hash: {
          digest: 'acbc',
          parts: {
            './index.html': 'xxxx',
            './pkg/entry.js': 'yyyy',
          },
        },
      };
      expect(Pkg.Is.dist(dist)).to.eql(false);
    });

    it('true', () => {
      const dist: t.DistPkg = {
        type: 'https://jsr.io/@sample/foo',
        pkg: { name: 'foo', version: '1.2.3' },
        build: {
          time: 1746520471244,
          size: { total: 123_456, pkg: 123 },
          builder: '@sys/driver-vite@0.0.0',
          runtime: '<runtime-uri>',
          hash: { policy: 'https://jsr.io/@sample/hash/0.0.1/src/hash.ts' },
        },
        hash: {
          digest: 'sha256-237bf73369464342ecde735fc719e09b2e61d72f796101890cdcee7efcd1bb18',
          parts: {
            './index.html': `sha256-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`,
            './pkg/entry.js': `sha256-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb`,
          },
        },
      };
      expect(Pkg.Is.dist(dist)).to.eql(true);
    });

    it('requires complete canonical part parses', () => {
      const hash = `sha256-${'a'.repeat(64)}`;
      const create = (part: unknown): unknown => ({
        type: 'https://jsr.io/@sample/foo',
        build: {
          time: 1746520471244,
          size: { total: 1, pkg: 0 },
          builder: '@sys/driver-vite@0.0.0',
          runtime: '<runtime-uri>',
          hash: { policy: 'https://jsr.io/@sample/hash/0.0.1/src/hash.ts' },
        },
        hash: { digest: hash, parts: { './index.html': part } },
      });

      expect(Pkg.Is.dist(create(hash))).to.eql(true);
      expect(Pkg.Is.dist(create(`${hash}:size=0`))).to.eql(true);

      const BAD: readonly unknown[] = [
        `${hash}:size=`,
        `${hash}:size=-1`,
        `${hash}:size=01`,
        `${hash}:size=1.5`,
        `${hash}:size=9007199254740992`,
        `${hash}:size=12kb`,
        `${hash}:SIZE=12`,
      ];
      BAD.forEach((part) => expect(Pkg.Is.dist(create(part))).to.eql(false));
    });

    it('true: canonical dist may omit root pkg', () => {
      const dist: t.DistPkg = {
        type: 'https://jsr.io/@sample/foo',
        build: {
          time: 1746520471244,
          size: { total: 123_456, pkg: 123 },
          builder: '@sys/driver-vite@0.0.0',
          runtime: '<runtime-uri>',
          hash: { policy: 'https://jsr.io/@sample/hash/0.0.1/src/hash.ts' },
        },
        hash: {
          digest: 'sha256-237bf73369464342ecde735fc719e09b2e61d72f796101890cdcee7efcd1bb18',
          parts: {
            './index.html': `sha256-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`,
            './pkg/entry.js': `sha256-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb`,
          },
        },
      };
      expect(Pkg.Is.dist(dist)).to.eql(true);
      expect(Pkg.Is.distCompat(dist)).to.eql(true);
    });

    it('true: canonical dist with detached signature descriptor', () => {
      const dist: t.DistPkg = {
        type: 'https://jsr.io/@sample/foo',
        pkg: { name: 'foo', version: '1.2.3' },
        build: {
          time: 1746520471244,
          size: { total: 123_456, pkg: 123 },
          builder: '@sys/driver-vite@0.0.0',
          runtime: '<runtime-uri>',
          hash: { policy: 'https://jsr.io/@sample/hash/0.0.1/src/hash.ts' },
          sign: {
            path: './dist.json.sig',
            scheme: 'Ed25519',
            key: 'kid:sample-1',
          },
        },
        hash: {
          digest: 'sha256-237bf73369464342ecde735fc719e09b2e61d72f796101890cdcee7efcd1bb18',
          parts: {
            './index.html': `sha256-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`,
            './pkg/entry.js': `sha256-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb`,
          },
        },
      };
      expect(Pkg.Is.dist(dist)).to.eql(true);
      expect(Pkg.Is.distCompat(dist)).to.eql(true);
    });

    it('true: canonical dist with hash ignore policy metadata', () => {
      const dist: t.DistPkg = {
        type: 'https://jsr.io/@sample/foo',
        build: {
          time: 1746520471244,
          size: { total: 123_456, pkg: 123 },
          builder: '@sys/driver-vite@0.0.0',
          runtime: '<runtime-uri>',
          hash: {
            policy: 'https://jsr.io/@sample/hash/0.0.1/src/hash.ts',
            ignore: {
              format: 'gitignore',
              rules: ['dist.json', 'dist.json.sig', '.DS_Store'],
              'rules:digest': `sha256-237bf73369464342ecde735fc719e09b2e61d72f796101890cdcee7efcd1bb18`,
            },
          },
        },
        hash: {
          digest: 'sha256-237bf73369464342ecde735fc719e09b2e61d72f796101890cdcee7efcd1bb18',
          parts: {
            './index.html': `sha256-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`,
          },
        },
      };
      expect(Pkg.Is.dist(dist)).to.eql(true);
    });

    it('false: invalid hash ignore policy metadata', () => {
      const dist: any = {
        type: 'https://jsr.io/@sample/foo',
        build: {
          time: 1746520471244,
          size: { total: 123_456, pkg: 123 },
          builder: '@sys/driver-vite@0.0.0',
          runtime: '<runtime-uri>',
          hash: {
            policy: 'https://jsr.io/@sample/hash/0.0.1/src/hash.ts',
            ignore: {
              format: 'glob',
              rules: ['dist.json'],
              digest: 'sha256-237bf73369464342ecde735fc719e09b2e61d72f796101890cdcee7efcd1bb18',
            },
          },
        },
        hash: {
          digest: 'sha256-237bf73369464342ecde735fc719e09b2e61d72f796101890cdcee7efcd1bb18',
          parts: {
            './index.html': `sha256-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`,
          },
        },
      };
      expect(Pkg.Is.dist(dist)).to.eql(false);
    });

    it('false: invalid detached signature descriptor scheme', () => {
      const dist: any = {
        type: 'https://jsr.io/@sample/foo',
        pkg: { name: 'foo', version: '1.2.3' },
        build: {
          time: 1746520471244,
          size: { total: 123_456, pkg: 123 },
          builder: '@sys/driver-vite@0.0.0',
          runtime: '<runtime-uri>',
          hash: { policy: 'https://jsr.io/@sample/hash/0.0.1/src/hash.ts' },
          sign: { path: './dist.json.sig', scheme: 'RSA' },
        },
        hash: {
          digest: 'sha256-237bf73369464342ecde735fc719e09b2e61d72f796101890cdcee7efcd1bb18',
          parts: {
            './pkg/entry.js': `sha256-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb`,
          },
        },
      };
      expect(Pkg.Is.dist(dist)).to.eql(false);
      expect(Pkg.Is.distCompat(dist)).to.eql(true);
    });

    it('false: non-string detached signature descriptor path', () => {
      const dist: any = {
        type: 'https://jsr.io/@sample/foo',
        pkg: { name: 'foo', version: '1.2.3' },
        build: {
          time: 1746520471244,
          size: { total: 123_456, pkg: 123 },
          builder: '@sys/driver-vite@0.0.0',
          runtime: '<runtime-uri>',
          hash: { policy: 'https://jsr.io/@sample/hash/0.0.1/src/hash.ts' },
          sign: { path: 123, scheme: 'Ed25519' },
        },
        hash: {
          digest: 'sha256-237bf73369464342ecde735fc719e09b2e61d72f796101890cdcee7efcd1bb18',
          parts: {
            './pkg/entry.js': `sha256-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb`,
          },
        },
      };
      expect(Pkg.Is.dist(dist)).to.eql(false);
    });

    it('false: non-string detached signature descriptor key', () => {
      const dist: any = {
        type: 'https://jsr.io/@sample/foo',
        pkg: { name: 'foo', version: '1.2.3' },
        build: {
          time: 1746520471244,
          size: { total: 123_456, pkg: 123 },
          builder: '@sys/driver-vite@0.0.0',
          runtime: '<runtime-uri>',
          hash: { policy: 'https://jsr.io/@sample/hash/0.0.1/src/hash.ts' },
          sign: { path: './dist.json.sig', scheme: 'Ed25519', key: 123 },
        },
        hash: {
          digest: 'sha256-237bf73369464342ecde735fc719e09b2e61d72f796101890cdcee7efcd1bb18',
          parts: {
            './pkg/entry.js': `sha256-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb`,
          },
        },
      };
      expect(Pkg.Is.dist(dist)).to.eql(false);
    });

    it('distCompat: true for legacy and canonical', () => {
      const legacy: t.DistPkgLegacy = {
        type: 'https://jsr.io/@sample/foo',
        pkg: { name: 'foo', version: '1.2.3' },
        build: {
          time: 1746520471244,
          size: { total: 123_456, pkg: 123 },
          builder: '@sys/driver-vite@0.0.0',
          runtime: '<runtime-uri>',
        },
        hash: {
          digest: 'sha256-237bf73369464342ecde735fc719e09b2e61d72f796101890cdcee7efcd1bb18',
          parts: {
            './pkg/entry.js': `sha256-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb`,
          },
        },
      };

      const canonical = Pkg.Dist.Compat.toCanonical(legacy, {
        policy: 'https://jsr.io/@sys/fs/0.0.225/src/m.Pkg/m.Pkg.Dist.ts',
      });

      expect(Pkg.Is.distCompat(legacy)).to.eql(true);
      expect(Pkg.Is.dist(legacy)).to.eql(false);
      expect(Pkg.Is.distCompat(canonical)).to.eql(true);
      expect(Pkg.Is.dist(canonical)).to.eql(true);
    });

    it('distCompat: true for legacy/canonical with omitted root pkg', () => {
      const legacy: t.DistPkgLegacy = {
        type: 'https://jsr.io/@sample/foo',
        build: {
          time: 1746520471244,
          size: { total: 123_456, pkg: 123 },
          builder: '@sys/driver-vite@0.0.0',
          runtime: '<runtime-uri>',
        },
        hash: {
          digest: 'sha256-237bf73369464342ecde735fc719e09b2e61d72f796101890cdcee7efcd1bb18',
          parts: {
            './pkg/entry.js': `sha256-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb`,
          },
        },
      };

      const canonical = Pkg.Dist.Compat.toCanonical(legacy, {
        policy: 'https://jsr.io/@sys/fs/0.0.225/src/m.Pkg/m.Pkg.Dist.ts',
      });

      expect(Pkg.Is.distCompat(legacy)).to.eql(true);
      expect(Pkg.Is.dist(legacy)).to.eql(false);
      expect(canonical?.pkg).to.eql(undefined);
      expect(Pkg.Is.distCompat(canonical)).to.eql(true);
      expect(Pkg.Is.dist(canonical)).to.eql(true);
    });
  });
});
