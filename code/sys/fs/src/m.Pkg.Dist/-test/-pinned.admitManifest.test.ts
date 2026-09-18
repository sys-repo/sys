import {
  CompositeHash,
  describe,
  expect,
  expectTypeOf,
  Hash,
  Ignore,
  it,
  type t,
} from '../../-test.ts';
import { Pinned } from '../../-exports/-pkg.dist.verify.ts';
import { Pkg } from '../../m.Pkg/mod.ts';
import { encodeManifest, manifestFixture } from './-u.manifest.fixture.ts';
import { cloneDist, limits, setup, teardown } from './-u.pinned.fixture.ts';

const encoder = new TextEncoder();

describe('Pkg.Dist.Pinned.admitManifest', () => {
  it('returns only immutable manifest evidence at exact limits through both public surfaces', async () => {
    const fixture = await manifestFixture();
    expect(Pkg.Dist.Pinned.admitManifest).to.equal(Pinned.admitManifest);
    const { bytes, integrity, limits } = fixture;
    const result = await Pinned.admitManifest({ bytes, integrity, limits });
    expectTypeOf(result).toEqualTypeOf<t.Pkg.Dist.Pinned.AdmitManifest.Result>();
    expect(result.kind).to.eql('manifest-admitted');
    if (result.kind !== 'manifest-admitted') throw new Error('Expected admitted manifest.');
    const { evidence } = result;
    expect(evidence).to.eql({ integrity, manifestBytes: bytes.byteLength, dist: fixture.dist });
    const { dist } = evidence;
    const frozen = [
      result,
      evidence,
      dist,
      dist.build,
      dist.build.size,
      dist.build.hash,
      dist.build.hash.ignore!,
      dist.build.hash.ignore!.rules,
      dist.hash,
      dist.hash.parts,
    ];
    expect(frozen.every(Object.isFrozen)).to.eql(true);
  });

  it('pins serialization, BOM, metadata, and names independently of the asset aggregate', async () => {
    const fixture = await manifestFixture();
    const { dist, bytes, integrity } = fixture;
    const changedMetadata = cloneDist(dist);
    changedMetadata.build.time++;
    const renamed = cloneDist(dist);
    renamed.hash.parts['index2.html'] = renamed.hash.parts['index.html'];
    delete renamed.hash.parts['index.html'];
    expect(CompositeHash.digest(renamed.hash.parts)).to.eql(dist.hash.digest);

    const variants = [
      encoder.encode(`${new TextDecoder().decode(bytes)}\n`),
      new Uint8Array([0xef, 0xbb, 0xbf, ...bytes]),
      encodeManifest(changedMetadata),
      encodeManifest(renamed),
    ];
    for (const variant of variants) {
      const input = { bytes: variant, integrity, limits };
      expect(Hash.sha256(variant)).not.to.eql(integrity);
      expect(await Pinned.admitManifest(input)).to.eql({ kind: 'integrity-mismatch' });
      const admitted = await Pinned.admitManifest({ ...input, integrity: Hash.sha256(variant) });
      expect(admitted.kind).to.eql('manifest-admitted');
      if (admitted.kind !== 'manifest-admitted') throw new Error('Expected admitted variant.');
      expect(admitted.evidence.dist.hash.digest).to.eql(dist.hash.digest);
    }
  });

  it('compares exact integrity before fatal UTF-8 and JSON decoding', async () => {
    const { integrity } = await manifestFixture();
    for (const bytes of [new Uint8Array([0xff]), encoder.encode('{'), encoder.encode('null')]) {
      expect(await Pinned.admitManifest({ bytes, integrity, limits }))
        .to.eql({ kind: 'integrity-mismatch' });
      expect(await Pinned.admitManifest({ bytes, integrity: Hash.sha256(bytes), limits }))
        .to.eql({ kind: 'malformed' });
    }
  });

  it('refuses checksum-matched invalid metadata instead of trusting the structural guard', async () => {
    const { dist } = await manifestFixture();
    const invalid: t.DistPkg[] = [];
    const noSize = cloneDist(dist);
    noSize.hash.parts['index.html'] = Hash.sha256('abc');
    invalid.push(noSize);
    const aggregate = cloneDist(dist);
    aggregate.hash.digest = Hash.sha256('other');
    invalid.push(aggregate);
    const totals = cloneDist(dist);
    totals.build.size.total++;
    invalid.push(totals);
    const packageTotal = cloneDist(dist);
    packageTotal.build.size.pkg++;
    invalid.push(packageTotal);
    const ignoreDigest = cloneDist(dist);
    ignoreDigest.build.hash.ignore = {
      format: 'gitignore',
      rules: [],
      'rules:digest': Hash.sha256('bad'),
    };
    invalid.push(ignoreDigest);
    const ignored = cloneDist(dist);
    ignored.build.hash.ignore = {
      format: 'gitignore',
      rules: ['index.html'],
      'rules:digest': await Ignore.digest(['index.html']),
    };
    invalid.push(ignored);
    const unboundedRules = cloneDist(dist);
    unboundedRules.build.hash.ignore = {
      format: 'gitignore',
      rules: ['a*a*b'],
      'rules:digest': await Ignore.digest(['a*a*b']),
    };
    invalid.push(unboundedRules);
    for (const value of invalid) {
      const bytes = encodeManifest(value);
      expect(await Pinned.admitManifest({ bytes, integrity: Hash.sha256(bytes), limits }))
        .to.eql({ kind: 'malformed' });
    }
  });

  it('rejects unsafe, colliding, and manifest-reserved paths', async () => {
    const { dist } = await manifestFixture();
    const paths = [
      '../index.html',
      '/index.html',
      'pkg',
      'pkg/./mod.js',
      'dist.json/child',
      'dist.json',
    ];
    for (const path of paths) {
      const value = cloneDist(dist);
      value.hash.parts[path] = value.hash.parts['index.html'];
      delete value.hash.parts['index.html'];
      value.hash.digest = CompositeHash.digest(value.hash.parts);
      const bytes = encodeManifest(value);
      expect(await Pinned.admitManifest({ bytes, integrity: Hash.sha256(bytes), limits }), path)
        .to.eql({ kind: 'unsafe-path' });
    }
  });

  it('bounds manifest bytes, declared sizes, and the derived graph including implied directories', async () => {
    const { bytes, integrity, limits: exact } = await manifestFixture();
    for (const key of ['manifestBytes', 'entries', 'fileBytes', 'totalBytes'] as const) {
      const reduced = { ...exact, [key]: exact[key] - 1 };
      expect(await Pinned.admitManifest({ bytes, integrity, limits: reduced }), key)
        .to.eql({ kind: 'limit-exceeded' });
    }
    const { dist } = await manifestFixture();
    dist.hash.parts['pkg/deep/mod.js'] = dist.hash.parts['pkg/mod.js'];
    delete dist.hash.parts['pkg/mod.js'];
    dist.hash.digest = CompositeHash.digest(dist.hash.parts);
    const nested = encodeManifest(dist);
    const input = {
      bytes: nested,
      integrity: Hash.sha256(nested),
      limits: { ...limits, entries: 4 },
    };
    expect(await Pinned.admitManifest(input)).to.eql({ kind: 'limit-exceeded' });
    expect((await Pinned.admitManifest({ ...input, limits: { ...input.limits, entries: 5 } })).kind)
      .to.eql('manifest-admitted');
  });

  it('refuses deep asset graphs before whole-path validation', async () => {
    const { dist, limits: exact } = await manifestFixture();
    const depth = 2048;
    for (const name of ['mod.js', 'CON']) {
      const value = cloneDist(dist);
      value.hash.parts = {
        'index.html': dist.hash.parts['index.html'],
        [`pkg/${'a/'.repeat(depth)}${name}`]: dist.hash.parts['pkg/mod.js'],
      };
      value.hash.digest = CompositeHash.digest(value.hash.parts);
      const bytes = encodeManifest(value);
      const input = {
        bytes,
        integrity: Hash.sha256(bytes),
        limits: { ...exact, manifestBytes: bytes.byteLength },
      };
      // CON exposes ordering: lexical validation would return unsafe-path before the late bound.
      expect(await Pinned.admitManifest(input), name).to.eql({ kind: 'limit-exceeded' });
      const withinBudget = await Pinned.admitManifest({
        ...input,
        limits: { ...input.limits, entries: depth + 4 },
      });
      expect(withinBudget.kind, name).to.eql(name === 'CON' ? 'unsafe-path' : 'manifest-admitted');
    }
  });

  it('counts shared directories once at the exact graph boundary', async () => {
    const { dist, limits: exact } = await manifestFixture();
    dist.hash.parts = {
      'pkg/shared/one.js': dist.hash.parts['index.html'],
      'pkg/shared/two.js': dist.hash.parts['pkg/mod.js'],
    };
    dist.hash.digest = CompositeHash.digest(dist.hash.parts);
    dist.build.size.pkg = dist.build.size.total;
    dist.build.sign = { path: 'dist.json.sig', scheme: 'Ed25519' };
    const bytes = encodeManifest(dist);
    const input = {
      bytes,
      integrity: Hash.sha256(bytes),
      limits: { ...exact, manifestBytes: bytes.byteLength, entries: 5 },
    };
    // dist.json + two assets + pkg/ + pkg/shared/. The signature is descriptive metadata.
    const admitted = await Pinned.admitManifest(input);
    expect(admitted.kind).to.eql('manifest-admitted');
    expect(await Pinned.admitManifest({ ...input, limits: { ...input.limits, entries: 4 } }))
      .to.eql({ kind: 'limit-exceeded' });
  });

  it('bounds signature-path normalization separately from the asset graph', async () => {
    const { dist, limits: exact } = await manifestFixture();
    const depth = 2048;
    for (const name of ['dist.json.sig', 'CON']) {
      dist.build.sign = { path: `sign/${'a/'.repeat(depth)}${name}`, scheme: 'Ed25519' };
      const bytes = encodeManifest(dist);
      const input = {
        bytes,
        integrity: Hash.sha256(bytes),
        limits: { ...exact, manifestBytes: bytes.byteLength },
      };
      expect(await Pinned.admitManifest(input), name).to.eql({ kind: 'limit-exceeded' });
      const withinBudget = await Pinned.admitManifest({
        ...input,
        limits: { ...input.limits, entries: depth + 3 },
      });
      expect(withinBudget.kind, name).to.eql(name === 'CON' ? 'unsafe-path' : 'manifest-admitted');
    }
  });

  it('rejects unsafe declared-size arithmetic and finite-limit overflow', async () => {
    const { dist } = await manifestFixture();
    dist.hash.parts['index.html'] = `${Hash.sha256('abc')}:size=${Number.MAX_SAFE_INTEGER}`;
    dist.hash.parts['pkg/mod.js'] = `${Hash.sha256('defg')}:size=1`;
    dist.hash.digest = CompositeHash.digest(dist.hash.parts);
    dist.build.size = { total: Number.MAX_SAFE_INTEGER, pkg: 1 };
    const bytes = encodeManifest(dist);
    const result = await Pinned.admitManifest({
      bytes,
      integrity: Hash.sha256(bytes),
      limits: {
        ...limits,
        fileBytes: Number.MAX_SAFE_INTEGER,
        totalBytes: Number.MAX_SAFE_INTEGER,
      },
    });
    expect(result).to.eql({ kind: 'limit-exceeded' });
  });

  it('preserves and deeply freezes admitted extension and signature metadata', async () => {
    const { dist } = await manifestFixture();
    dist.build.sign = { path: 'dist.json.sig', scheme: 'Ed25519', key: 'hint-not-trust' };
    const value = { ...dist, extension: { values: ['retained'] } };
    const bytes = encodeManifest(value);
    const result = await Pinned.admitManifest({ bytes, integrity: Hash.sha256(bytes), limits });
    expect(result.kind).to.eql('manifest-admitted');
    if (result.kind !== 'manifest-admitted') throw new Error('Expected admitted extension.');
    expect(result.evidence.dist).to.eql(value);
    expect(Object.isFrozen(result.evidence.dist.build.sign)).to.eql(true);
    const extension = result.evidence.dist as typeof value;
    expect(Object.isFrozen(extension.extension.values)).to.eql(true);
  });

  it('admitting a manifest does not verify changed asset bytes', async () => {
    const fixture = await setup();
    try {
      await Deno.writeTextFile(`${fixture.dir}/index.html`, '<h1>tampered</h1>');
      const { integrity, dir, manifest: bytes } = fixture;
      const admitted = await Pinned.admitManifest({ bytes, integrity, limits });
      expect(admitted.kind).to.eql('manifest-admitted');
      expect(await Pinned.verify({ dir, integrity, limits })).to.eql({ kind: 'content-mismatch' });
    } finally {
      await teardown(fixture);
    }
  });
});

Deno.test({
  name: 'Pinned.admitManifest → success with all Deno permissions denied',
  permissions: 'none',
  async fn() {
    const { bytes, integrity, limits } = await manifestFixture();
    const result = await Pinned.admitManifest({ bytes, integrity, limits });
    expect(result.kind).to.eql('manifest-admitted');
  },
});
