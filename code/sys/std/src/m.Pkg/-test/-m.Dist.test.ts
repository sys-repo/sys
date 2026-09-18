import { describe, expect, it, type t } from '../../-test.ts';
import { Dist, Pkg } from '../mod.ts';

describe('Pkg.Dist', () => {
  it('API', () => {
    expect(Pkg.Dist).to.equal(Dist);
  });

  describe('Dist.Compat', () => {
    it('toCanonical: legacy requires explicit policy', () => {
      const legacy: t.DistPkgLegacy = {
        type: 'https://jsr.io/@sample/foo',
        pkg: { name: '@ns/foo', version: '1.2.3' },
        build: {
          time: 1746520471244,
          size: { total: 1234, pkg: 1234 },
          builder: '@scope/sample@0.0.0',
          runtime: '<runtime-uri>',
        },
        hash: {
          digest: 'sha256-237bf73369464342ecde735fc719e09b2e61d72f796101890cdcee7efcd1bb18',
          parts: {
            './index.html':
              'sha256-237bf73369464342ecde735fc719e09b2e61d72f796101890cdcee7efcd1bb18',
          },
        },
      };

      expect(Pkg.Dist.Compat.legacy(legacy)).to.eql(true);
      expect(Pkg.Dist.Compat.toCanonical(legacy)).to.eql(undefined);

      const policy = 'https://jsr.io/@sys/fs/0.0.225/src/m.Pkg/m.Pkg.Dist.ts';
      const canonical = Pkg.Dist.Compat.toCanonical(legacy, { policy });
      expect(canonical?.build.hash.policy).to.eql(policy);
      expect(Pkg.Is.dist(canonical)).to.eql(true);
    });

    it('toCanonical: preserves omitted root pkg', () => {
      const legacy: t.DistPkgLegacy = {
        type: 'https://jsr.io/@sample/foo',
        build: {
          time: 1746520471244,
          size: { total: 1234, pkg: 1234 },
          builder: '@scope/sample@0.0.0',
          runtime: '<runtime-uri>',
        },
        hash: {
          digest: 'sha256-237bf73369464342ecde735fc719e09b2e61d72f796101890cdcee7efcd1bb18',
          parts: {
            './index.html':
              'sha256-237bf73369464342ecde735fc719e09b2e61d72f796101890cdcee7efcd1bb18',
          },
        },
      };

      const canonical = Pkg.Dist.Compat.toCanonical(legacy, {
        policy: 'https://jsr.io/@sys/fs/0.0.225/src/m.Pkg/m.Pkg.Dist.ts',
      });

      expect(canonical?.pkg).to.eql(undefined);
      expect(Pkg.Is.dist(canonical)).to.eql(true);
    });
  });

  describe('Dist.Is', () => {
    it('Is.codePath: true', () => {
      const test = (path: string, expected: boolean) => {
        expect(Pkg.Dist.Is.codePath(path)).to.eql(expected);
      };

      test('pkg', false);
      test('pkg/', true);
      test('/pkg/', true);
      test('/pkg/foo', true);
      test('/pkg/foo/pkg/bar', true);
      test('/pkg/bar', true);

      test('', false);
      test('foo', false);

      const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((value: any) => test(value, false));
    });
  });

  describe('Dist.Part', () => {
    const HASH = `sha256-${'a'.repeat(64)}`;

    it('API', () => {
      expect(Pkg.Dist.Part).to.equal(Dist.Part);
    });

    it('parse: canonical hash-only compatibility', () => {
      expect(Pkg.Dist.Part.parse(HASH)).to.eql({ hash: HASH });
    });

    it('parse: canonical safe byte sizes', () => {
      const test = (size: string, expected: number) => {
        expect(Pkg.Dist.Part.parse(`${HASH}:size=${size}`)).to.eql({ hash: HASH, size: expected });
      };

      test('0', 0);
      test('530', 530);
      test('9007199254740991', Number.MAX_SAFE_INTEGER);
    });

    it('hash and size derive only from complete canonical parses', () => {
      expect(Pkg.Dist.Part.hash(HASH)).to.eql(HASH);
      expect(Pkg.Dist.Part.hash(`${HASH}:size=12`)).to.eql(HASH);
      expect(Pkg.Dist.Part.size(HASH)).to.eql(undefined);
      expect(Pkg.Dist.Part.size(`${HASH}:size=12`)).to.eql(12);

      expect(Pkg.Dist.Part.hash(`${HASH}:size=-1`)).to.eql(undefined);
      expect(Pkg.Dist.Part.size(`${HASH}:size=-1`)).to.eql(undefined);
    });

    it('parse: rejects noncanonical hashes and exact-input violations', () => {
      const BAD: readonly unknown[] = [
        '',
        'sha256-',
        `sha256-${'a'.repeat(63)}`,
        `sha256-${'a'.repeat(65)}`,
        `SHA256-${'a'.repeat(64)}`,
        `sha256-${'A'.repeat(64)}`,
        `sha256-${'g'.repeat(64)}`,
        ` ${HASH}`,
        `${HASH} `,
        `${HASH}\n`,
        `${HASH}\r\n`,
        `md5-${'a'.repeat(64)}`,
      ];

      BAD.forEach((value) => {
        expect(Pkg.Dist.Part.parse(value)).to.eql(undefined);
        expect(Pkg.Dist.Part.hash(value)).to.eql(undefined);
        expect(Pkg.Dist.Part.size(value)).to.eql(undefined);
      });
    });

    it('parse: rejects malformed or unsafe size suffixes without partial degradation', () => {
      const BAD = [
        '',
        '+1',
        '-0',
        '-1',
        '00',
        '01',
        '1.0',
        '1e3',
        '１２',
        '9007199254740992',
        '99999999999999999999999999999999999999999999999999',
        '12kb',
        '12:size=13',
      ];

      BAD.forEach((size) => {
        const value = `${HASH}:size=${size}`;
        expect(Pkg.Dist.Part.parse(value)).to.eql(undefined);
        expect(Pkg.Dist.Part.hash(value)).to.eql(undefined);
        expect(Pkg.Dist.Part.size(value)).to.eql(undefined);
      });

      expect(Pkg.Dist.Part.parse(`${HASH}:SIZE=12`)).to.eql(undefined);
      expect(Pkg.Dist.Part.parse(`${HASH}:size=12\n`)).to.eql(undefined);
      expect(Pkg.Dist.Part.parse(`${HASH}:size=12 trailing`)).to.eql(undefined);
    });

    it('parse: ignores non-strings', () => {
      const NON: readonly unknown[] = [123, true, null, undefined, BigInt(0), Symbol('x'), {}, []];

      NON.forEach((value) => {
        expect(Pkg.Dist.Part.parse(value)).to.eql(undefined);
        expect(Pkg.Dist.Part.hash(value)).to.eql(undefined);
        expect(Pkg.Dist.Part.size(value)).to.eql(undefined);
      });
    });
  });
});
