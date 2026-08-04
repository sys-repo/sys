import {
  CompositeHash,
  describe,
  expect,
  Hash,
  Ignore,
  Is,
  it,
  Json,
  Num,
  type t,
} from '../../-test.ts';
import { Pkg } from '../mod.ts';
import { cloneDist, limits, setup, teardown, writeManifest } from './-u.pinned.fixture.ts';

const decoder = new TextDecoder();
const encoder = new TextEncoder();

describe('Pkg.Dist.Pinned.verify manifest admission', () => {
  it('distinguishes invalid caller input from an exact pin mismatch', async () => {
    const fixture = await setup();
    try {
      const malformedPin = await Pkg.Dist.Pinned.verify({
        dir: fixture.dir,
        integrity: 'sha256-nope' as t.StringHash,
        limits,
      });
      expect(malformedPin).to.eql({ kind: 'invalid-input' });

      const wrongPin = await Pkg.Dist.Pinned.verify({
        dir: fixture.dir,
        integrity: `sha256-${'0'.repeat(64)}` as t.StringHash,
        limits,
      });
      expect(wrongPin).to.eql({ kind: 'integrity-mismatch' });

      const invalidLimits = await Pkg.Dist.Pinned.verify({
        dir: fixture.dir,
        integrity: fixture.integrity,
        limits: { ...limits, entries: 0 },
      });
      expect(invalidLimits).to.eql({ kind: 'invalid-input' });
    } finally {
      await teardown(fixture);
    }
  });

  it('rejects invalid UTF-8, malformed JSON, legacy, and unsafe nested shapes', async () => {
    const fixture = await setup();
    try {
      const invalidUtf8 = new Uint8Array([0xff, 0xfe, 0xfd]);
      await Deno.writeFile(`${fixture.dir}/dist.json`, invalidUtf8);
      const utf8 = await Pkg.Dist.Pinned.verify({
        dir: fixture.dir,
        integrity: Hash.sha256(invalidUtf8),
        limits,
      });
      expect(utf8).to.eql({ kind: 'malformed' });

      const malformedJson = encoder.encode('{');
      await Deno.writeFile(`${fixture.dir}/dist.json`, malformedJson);
      const json = await Pkg.Dist.Pinned.verify({
        dir: fixture.dir,
        integrity: Hash.sha256(malformedJson),
        limits,
      });
      expect(json).to.eql({ kind: 'malformed' });

      const unsafeShapes: readonly unknown[] = [
        { type: 'x', build: {}, hash: {} },
        { ...fixture.dist, build: [] },
        { ...fixture.dist, hash: [] },
        { ...fixture.dist, build: { ...fixture.dist.build, hash: [] } },
        { ...fixture.dist, build: { ...fixture.dist.build, hash: undefined } },
      ];
      for (const value of unsafeShapes) {
        const bytes = encoder.encode(Json.stringify(value));
        await Deno.writeFile(`${fixture.dir}/dist.json`, bytes);
        const shape = await Pkg.Dist.Pinned.verify({
          dir: fixture.dir,
          integrity: Hash.sha256(bytes),
          limits,
        });
        expect(shape).to.eql({ kind: 'malformed' });
      }
    } finally {
      await teardown(fixture);
    }
  });

  it('deeply freezes bounded authenticated extensions without call-stack recursion', async () => {
    const fixture = await setup();
    try {
      const depth = 20_000;
      const source = decoder.decode(fixture.manifest);
      const text = `{"extension":${'['.repeat(depth)}null${']'.repeat(depth)},${source.slice(1)}`;
      const bytes = encoder.encode(text);
      await Deno.writeFile(`${fixture.dir}/dist.json`, bytes);

      const result = await Pkg.Dist.Pinned.verify({
        dir: fixture.dir,
        integrity: Hash.sha256(bytes),
        limits,
      });
      expect(result.kind).to.eql('verified');
      if (result.kind !== 'verified') return;

      let current = (result.evidence.dist as unknown as { extension: unknown }).extension;
      let frozen = true;
      for (let index = 0; index < depth; index++) {
        if (!Is.array(current)) {
          frozen = false;
          break;
        }
        frozen = frozen && Object.isFrozen(current);
        current = current[0];
      }
      expect(frozen).to.eql(true);
      expect(current).to.eql(null);
    } finally {
      await teardown(fixture);
    }
  });

  it('requires complete canonical parts, digests, ignore metadata, and build totals', async () => {
    const fixture = await setup();
    try {
      const cases: t.DistPkg[] = [];

      const noSize = cloneDist(fixture.dist);
      const firstPath = Object.keys(noSize.hash.parts)[0];
      noSize.hash.parts[firstPath] = Pkg.Dist.Part.hash(noSize.hash.parts[firstPath])!;
      noSize.hash.digest = CompositeHash.digest(noSize.hash.parts);
      cases.push(noSize);

      const badDigest = cloneDist(fixture.dist);
      badDigest.hash.digest = `sha256-${'0'.repeat(64)}` as t.StringHash;
      cases.push(badDigest);

      const badRules = cloneDist(fixture.dist);
      const rules = [...badRules.build.hash.ignore!.rules, ' assets/private '];
      badRules.build.hash.ignore = {
        format: 'gitignore',
        rules,
        'rules:digest': await Ignore.digest(rules),
      };
      cases.push(badRules);

      const badRulesDigest = cloneDist(fixture.dist);
      const digestRules = badRulesDigest.build.hash.ignore!.rules;
      badRulesDigest.build.hash.ignore = {
        format: 'gitignore',
        rules: [...digestRules],
        'rules:digest': `sha256-${'0'.repeat(64)}`,
      };
      cases.push(badRulesDigest);

      const ignoredPart = cloneDist(fixture.dist);
      const ignoredRules = Ignore.normalize([
        ...ignoredPart.build.hash.ignore!.rules,
        'assets/app.js',
      ]);
      ignoredPart.build.hash.ignore = {
        format: 'gitignore',
        rules: [...ignoredRules],
        'rules:digest': await Ignore.digest(ignoredRules),
      };
      cases.push(ignoredPart);

      const badTotals = cloneDist(fixture.dist);
      badTotals.build.size.total += 1;
      cases.push(badTotals);

      const noParts = cloneDist(fixture.dist);
      noParts.hash.parts = {};
      noParts.hash.digest = CompositeHash.digest({});
      noParts.build.size = { total: 0, pkg: 0 };
      cases.push(noParts);

      const badPolicy = cloneDist(fixture.dist);
      badPolicy.build.hash.policy = 'not-a-url';
      cases.push(badPolicy);

      for (const dist of cases) {
        const manifest = await writeManifest(fixture.dir, dist);
        const result = await Pkg.Dist.Pinned.verify({
          dir: fixture.dir,
          integrity: manifest.integrity,
          limits,
        });
        expect(result).to.eql({ kind: 'malformed' });
      }
    } finally {
      await teardown(fixture);
    }
  });

  it('admits bounded ignore wildcards and rejects ambiguous repetition', async () => {
    const fixture = await setup();
    try {
      const accepted = cloneDist(fixture.dist);
      const acceptedRules = Ignore.normalize([
        ...accepted.build.hash.ignore!.rules,
        '**/*.map',
      ]);
      accepted.build.hash.ignore = {
        format: 'gitignore',
        rules: [...acceptedRules],
        'rules:digest': await Ignore.digest(acceptedRules),
      };
      const acceptedManifest = await writeManifest(fixture.dir, accepted);
      const verified = await Pkg.Dist.Pinned.verify({
        dir: fixture.dir,
        integrity: acceptedManifest.integrity,
        limits,
      });
      expect(verified.kind).to.eql('verified');

      const ambiguousRules: readonly string[] = ['a/**/**/zz', '*a*a'];
      for (const rule of ambiguousRules) {
        const rejected = cloneDist(fixture.dist);
        const rules = Ignore.normalize([...rejected.build.hash.ignore!.rules, rule]);
        rejected.build.hash.ignore = {
          format: 'gitignore',
          rules: [...rules],
          'rules:digest': await Ignore.digest(rules),
        };
        const manifest = await writeManifest(fixture.dir, rejected);
        const result = await Pkg.Dist.Pinned.verify({
          dir: fixture.dir,
          integrity: manifest.integrity,
          limits,
        });
        expect(result).to.eql({ kind: 'malformed' });
      }
    } finally {
      await teardown(fixture);
    }
  });

  it('rejects noncanonical, reserved, colliding, and structurally conflicting paths', async () => {
    const fixture = await setup();
    try {
      const cases: t.DistPkg[] = [];
      const firstPath = Object.keys(fixture.dist.hash.parts)[0];
      const firstPart = fixture.dist.hash.parts[firstPath];

      const noncanonical = cloneDist(fixture.dist);
      delete noncanonical.hash.parts[firstPath];
      noncanonical.hash.parts[`./${firstPath}`] = firstPart;
      noncanonical.hash.digest = CompositeHash.digest(noncanonical.hash.parts);
      cases.push(noncanonical);

      const reserved = cloneDist(fixture.dist);
      delete reserved.hash.parts[firstPath];
      reserved.hash.parts['nested/dist.json'] = firstPart;
      reserved.hash.digest = CompositeHash.digest(reserved.hash.parts);
      cases.push(reserved);

      const collision = cloneDist(fixture.dist);
      collision.build.sign = {
        path: firstPath,
        scheme: 'Ed25519',
      };
      cases.push(collision);

      const structural = cloneDist(fixture.dist);
      structural.hash.parts.assets = firstPart;
      structural.hash.digest = CompositeHash.digest(structural.hash.parts);
      structural.build.size.total += Pkg.Dist.Part.size(firstPart) ?? 0;
      cases.push(structural);

      for (const dist of cases) {
        const manifest = await writeManifest(fixture.dir, dist);
        const result = await Pkg.Dist.Pinned.verify({
          dir: fixture.dir,
          integrity: manifest.integrity,
          limits,
        });
        expect(result).to.eql({ kind: 'unsafe-path' });
      }
    } finally {
      await teardown(fixture);
    }
  });

  it('accepts omitted package metadata and inert authenticated provenance', async () => {
    const fixture = await setup();
    try {
      const dist = cloneDist(fixture.dist);
      delete dist.pkg;
      dist.build.hash.policy = 'https://example.com/dist-policy/v1';
      dist.build.sign = {
        path: 'dist.json.sig',
        scheme: 'Ed25519',
        key: 'release-key',
      };
      const manifest = await writeManifest(fixture.dir, dist);
      const result = await Pkg.Dist.Pinned.verify({
        dir: fixture.dir,
        integrity: manifest.integrity,
        limits,
      });
      expect(result.kind).to.eql('verified');
    } finally {
      await teardown(fixture);
    }
  });

  it('admits the declared-part limit before bounding a malformed excess value', async () => {
    const fixture = await setup();
    try {
      const paths = Object.keys(fixture.dist.hash.parts);

      const atLimit = cloneDist(fixture.dist);
      const atLimitPath = paths[paths.length - 1];
      atLimit.hash.parts[atLimitPath] = 'malformed' as t.StringFileHashUri;
      const atLimitManifest = await writeManifest(fixture.dir, atLimit);
      const admitted = await Pkg.Dist.Pinned.verify({
        dir: fixture.dir,
        integrity: atLimitManifest.integrity,
        limits: { ...limits, entries: paths.length },
      });
      expect(admitted).to.eql({ kind: 'malformed' });

      const excess = cloneDist(fixture.dist);
      const excessPath = paths[1];
      excess.hash.parts[excessPath] = 'malformed' as t.StringFileHashUri;
      const excessManifest = await writeManifest(fixture.dir, excess);
      const bounded = await Pkg.Dist.Pinned.verify({
        dir: fixture.dir,
        integrity: excessManifest.integrity,
        limits: { ...limits, entries: 1 },
      });
      expect(bounded).to.eql({ kind: 'limit-exceeded' });
    } finally {
      await teardown(fixture);
    }
  });

  it('enforces every caller-owned resource limit', async () => {
    const fixture = await setup();
    try {
      const manifest = await Pkg.Dist.Pinned.verify({
        dir: fixture.dir,
        integrity: fixture.integrity,
        limits: { ...limits, manifestBytes: fixture.manifest.byteLength - 1 },
      });
      expect(manifest).to.eql({ kind: 'limit-exceeded' });

      const file = await Pkg.Dist.Pinned.verify({
        dir: fixture.dir,
        integrity: fixture.integrity,
        limits: { ...limits, fileBytes: 1 },
      });
      expect(file).to.eql({ kind: 'limit-exceeded' });

      const total = await Pkg.Dist.Pinned.verify({
        dir: fixture.dir,
        integrity: fixture.integrity,
        limits: { ...limits, totalBytes: 1 },
      });
      expect(total).to.eql({ kind: 'limit-exceeded' });

      const entries = await Pkg.Dist.Pinned.verify({
        dir: fixture.dir,
        integrity: fixture.integrity,
        limits: { ...limits, entries: 3 },
      });
      expect(entries).to.eql({ kind: 'limit-exceeded' });

      const unsafeArithmetic = cloneDist(fixture.dist);
      for (const [path, part] of Object.entries(unsafeArithmetic.hash.parts)) {
        const hash = Pkg.Dist.Part.hash(part)!;
        unsafeArithmetic.hash.parts[path] = `${hash}:size=${Num.MAX_INT}` as t.StringFileHashUri;
      }
      unsafeArithmetic.build.size = {
        total: Num.MAX_INT,
        pkg: Num.MAX_INT,
      };
      const arithmeticManifest = await writeManifest(fixture.dir, unsafeArithmetic);
      const arithmetic = await Pkg.Dist.Pinned.verify({
        dir: fixture.dir,
        integrity: arithmeticManifest.integrity,
        limits: {
          ...limits,
          fileBytes: Num.MAX_INT,
          totalBytes: Num.MAX_INT,
        },
      });
      expect(arithmetic).to.eql({ kind: 'limit-exceeded' });
    } finally {
      await teardown(fixture);
    }
  });
});
