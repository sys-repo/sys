import { describe, expect, expectTypeOf, Hash, it, Num, type t } from '../../-test.ts';
import { Pinned } from '../../-exports/-pkg.dist.verify.ts';
import { Pkg } from '../../m.Pkg/mod.ts';
import { encodeManifest, manifestFixture } from './-u.manifest.fixture.ts';
import { cloneDist, limits, setup, teardown } from './-u.pinned.fixture.ts';

const encoder = new TextEncoder();

/** Explicit fixture authorship, never discovery of an expectation from acquired bytes. */
function select(dist: t.DeepMutable<t.DistPkg>): t.DistPin {
  dist.hash.digest = Hash.sha256(Pkg.Dist.Content.encode(dist.hash.parts));
  return { scheme: dist.hash.scheme, digest: dist.hash.digest };
}

describe('Pkg.Dist.Pinned.admitManifest', () => {
  it('exact limits → immutable inventory evidence through both public surfaces', async () => {
    const fixture = await manifestFixture();
    expect(Pkg.Dist.Pinned.admitManifest).to.equal(Pinned.admitManifest);
    const { bytes, pin, limits, manifestChecksum } = fixture;
    const result = await Pinned.admitManifest({ bytes, pin, limits });
    expectTypeOf(result).toEqualTypeOf<t.Pkg.Dist.Pinned.AdmitManifest.Result>();
    if (result.kind !== 'manifest-admitted') throw new Error('Expected admitted manifest.');
    const { evidence } = result;
    expect(evidence).to.eql({
      manifestChecksum,
      manifestBytes: bytes.byteLength,
      content: fixture.dist.hash,
    });
    expect([result, evidence, evidence.content, evidence.content.parts].every(Object.isFrozen))
      .to.eql(true);
  });

  it('layout, BOM and metadata → same pin; renamed payload → different pin', async () => {
    const fixture = await manifestFixture();
    const { dist, bytes, pin, manifestChecksum } = fixture;
    const changedMetadata = cloneDist(dist);
    changedMetadata.build.time++;
    const variants = [
      encoder.encode(`${new TextDecoder().decode(bytes)}\n`),
      new Uint8Array([0xef, 0xbb, 0xbf, ...bytes]),
      encodeManifest(changedMetadata),
    ];
    for (const variant of variants) {
      const admitted = await Pinned.admitManifest({ bytes: variant, pin, limits });
      if (admitted.kind !== 'manifest-admitted') throw new Error('Expected admitted variant.');
      expect(admitted.evidence.manifestChecksum).not.to.eql(manifestChecksum);
      expect(admitted.evidence.content).to.eql(dist.hash);
    }
    const renamed = cloneDist(dist);
    renamed.hash.parts['index2.html'] = renamed.hash.parts['index.html'];
    delete renamed.hash.parts['index.html'];
    const selected = select(renamed);
    expect(selected).not.to.eql(pin);
    const input = { bytes: encodeManifest(renamed), pin, limits };
    expect(await Pinned.admitManifest(input)).to.eql({ kind: 'pin-mismatch' });
    expect((await Pinned.admitManifest({ ...input, pin: selected })).kind).to.eql(
      'manifest-admitted',
    );
  });

  it('malformed UTF-8 or JSON → bounded refusal before content comparison', async () => {
    const { pin } = await manifestFixture();
    for (const bytes of [new Uint8Array([0xff]), encoder.encode('{'), encoder.encode('null')]) {
      expect(await Pinned.admitManifest({ bytes, pin, limits })).to.eql({ kind: 'malformed' });
    }
  });

  it('missing length or forged digest → refusal; excluded metadata → no policy authority', async () => {
    const { dist, pin } = await manifestFixture();
    const noSize = cloneDist(dist);
    noSize.hash.parts['index.html'] = Hash.sha256('abc');
    const aggregate = cloneDist(dist);
    aggregate.hash.digest = Hash.sha256('other');
    for (const value of [noSize, aggregate]) {
      const bytes = encodeManifest(value);
      const result = await Pinned.admitManifest({ bytes, pin, limits });
      expect(result).to.eql({ kind: 'malformed' });
    }
    const observed = cloneDist(dist);
    observed.build.size = { total: -1, pkg: -1 };
    observed.build.hash = {
      policy: 'not-an-algorithm',
      ignore: { format: 'gitignore', rules: ['index.html', '*a*a*b'], 'rules:digest': 'bad' },
    };
    const admitted = await Pinned.admitManifest({ bytes: encodeManifest(observed), pin, limits });
    if (admitted.kind !== 'manifest-admitted') throw new Error('Expected inert observations.');
    expect(admitted.evidence.content).to.eql(dist.hash);
  });

  it('unsafe, colliding and manifest-reserved paths → refusal', async () => {
    const { dist, pin } = await manifestFixture();
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
      const bytes = encodeManifest(value);
      const result = await Pinned.admitManifest({ bytes, pin, limits });
      expect(result, path).to.eql({ kind: 'unsafe-path' });
    }
  });

  it('manifest, file, total and derived graph limits → exact boundary enforcement', async () => {
    const { bytes, pin, limits: exact, dist } = await manifestFixture();
    for (const key of ['manifestBytes', 'entries', 'fileBytes', 'totalBytes'] as const) {
      const reduced = { ...exact, [key]: exact[key] - 1 };
      const result = await Pinned.admitManifest({ bytes, pin, limits: reduced });
      expect(result, key).to.eql({ kind: 'limit-exceeded' });
    }
    dist.hash.parts['pkg/deep/mod.js'] = dist.hash.parts['pkg/mod.js'];
    delete dist.hash.parts['pkg/mod.js'];
    const nestedPin = select(dist);
    const input = {
      bytes: encodeManifest(dist),
      pin: nestedPin,
      limits: { ...limits, entries: 4 },
    };
    expect(await Pinned.admitManifest(input)).to.eql({ kind: 'limit-exceeded' });
    const admitted = await Pinned.admitManifest({
      ...input,
      limits: { ...input.limits, entries: 5 },
    });
    expect(admitted.kind).to.eql('manifest-admitted');
  });

  it('deep asset graphs → bounded before lexical validation', async () => {
    const { dist, limits: exact } = await manifestFixture();
    const depth = 1000;
    for (const name of ['mod.js', 'CON']) {
      const value = cloneDist(dist);
      value.hash.parts = {
        'index.html': dist.hash.parts['index.html'],
        [`pkg/${'a/'.repeat(depth)}${name}`]: dist.hash.parts['pkg/mod.js'],
      };
      const pin = select(value);
      const bytes = encodeManifest(value);
      const input = { bytes, pin, limits: { ...exact, manifestBytes: bytes.byteLength } };
      expect(await Pinned.admitManifest(input), name).to.eql({ kind: 'limit-exceeded' });
      const withinBudget = await Pinned.admitManifest({
        ...input,
        limits: { ...input.limits, entries: depth + 4 },
      });
      expect(withinBudget.kind, name).to.eql(name === 'CON' ? 'unsafe-path' : 'manifest-admitted');
    }
  });

  it('shared directories → counted once at the exact graph boundary', async () => {
    const { dist, limits: exact } = await manifestFixture();
    dist.hash.parts = {
      'pkg/shared/one.js': dist.hash.parts['index.html'],
      'pkg/shared/two.js': dist.hash.parts['pkg/mod.js'],
    };
    const pin = select(dist);
    dist.build.sign = { path: 'dist.json.sig', scheme: 'Ed25519' };
    const bytes = encodeManifest(dist);
    const input = { bytes, pin, limits: { ...exact, manifestBytes: bytes.byteLength, entries: 5 } };
    // dist.json + two assets + pkg/ + pkg/shared/. Signature hints add no inventory entries.
    expect((await Pinned.admitManifest(input)).kind).to.eql('manifest-admitted');
    const reduced = await Pinned.admitManifest({
      ...input,
      limits: { ...input.limits, entries: 4 },
    });
    expect(reduced).to.eql({ kind: 'limit-exceeded' });
  });

  it('signature hints → neither path normalization nor inventory authority', async () => {
    const { dist, pin, limits: exact } = await manifestFixture();
    for (const name of ['dist.json.sig', 'CON']) {
      dist.build.sign = { path: `sign/${'a/'.repeat(2048)}${name}`, scheme: 'Ed25519' };
      const bytes = encodeManifest(dist);
      const result = await Pinned.admitManifest({
        bytes,
        pin,
        limits: { ...exact, manifestBytes: bytes.byteLength },
      });
      if (result.kind !== 'manifest-admitted') throw new Error('Expected excluded signature hint.');
      expect(result.evidence.content).to.eql(dist.hash);
    }
  });

  it('unsafe declared-size arithmetic → refusal before serialization', async () => {
    const { dist, pin } = await manifestFixture();
    dist.hash.parts['index.html'] = `${Hash.sha256('abc')}:size=${Num.MAX_INT}`;
    dist.hash.parts['pkg/mod.js'] = `${Hash.sha256('defg')}:size=1`;
    const result = await Pinned.admitManifest({
      bytes: encodeManifest(dist),
      pin,
      limits: {
        ...limits,
        fileBytes: Num.MAX_INT,
        totalBytes: Num.MAX_INT,
      },
    });
    expect(result).to.eql({ kind: 'limit-exceeded' });
  });

  it('extension and signature metadata → excluded from authenticated evidence', async () => {
    const { dist, pin } = await manifestFixture();
    dist.build.sign = { path: 'dist.json.sig', scheme: 'Ed25519', key: 'hint-not-trust' };
    const value = { ...dist, extension: { values: ['observed'] } };
    const result = await Pinned.admitManifest({ bytes: encodeManifest(value), pin, limits });
    if (result.kind !== 'manifest-admitted') throw new Error('Expected admitted inventory.');
    expect(result.evidence.content).to.eql(dist.hash);
    expect(Object.keys(result.evidence).sort()).to.eql([
      'content',
      'manifestBytes',
      'manifestChecksum',
    ]);
  });

  it('manifest admission → no claim of actual asset verification', async () => {
    const fixture = await setup();
    try {
      await Deno.writeTextFile(`${fixture.dir}/index.html`, '<h1>tampered</h1>');
      const { pin, dir, manifest: bytes } = fixture;
      expect((await Pinned.admitManifest({ bytes, pin, limits })).kind).to.eql('manifest-admitted');
      expect(await Pinned.verify({ dir, pin, limits })).to.eql({ kind: 'content-mismatch' });
    } finally {
      await teardown(fixture);
    }
  });
});

Deno.test({
  name: 'Pinned.admitManifest → success with all Deno permissions denied',
  permissions: 'none',
  async fn() {
    const { bytes, pin, limits } = await manifestFixture();
    expect((await Pinned.admitManifest({ bytes, pin, limits })).kind).to.eql('manifest-admitted');
  },
});
