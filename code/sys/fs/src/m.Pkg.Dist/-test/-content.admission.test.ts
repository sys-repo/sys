import { describe, expect, Hash, it, Json, Str, type t } from '../../-test.ts';
import { Pinned } from '../../-exports/-pkg.dist.verify.ts';
import { D, Num, Obj, Pkg } from '../common.ts';
import { verifyPinnedWithIo } from '../u.verify/u.verify.ts';
import { DEFAULT_IO, isFailure } from '../u.verify/u.io.ts';
import { snapshotVerifyLimits } from '../u.verify/u.input.ts';
import { parseManifestBytes } from '../u.verify/u.manifest.ts';

const encoder = new TextEncoder();
const hashA = 'sha256-559aead08264d5795d3909718cdd05abd49572e84fe55590eef31a88a08fdffd';
const digest = 'sha256-c3e2a19d508cf0cd7a8dd88f13a2ba87cf2f29317732dab555a81c9e02c3a045';
const pin: t.DistPin = Object.freeze({ scheme: 'sys.dist/v2', digest });
const parts = { 'a.txt': `${hashA}:size=1` };
const limits: t.Pkg.Dist.Verify.Limits = {
  manifestBytes: 1_048_576,
  entries: 100,
  fileBytes: 1024,
  totalBytes: 4096,
};

function document(observations: Record<string, unknown> = {}): Uint8Array {
  return encoder.encode(Json.stringify({ ...observations, hash: { ...pin, parts } }, 0));
}

function admit(bytes: Uint8Array, bounds = limits) {
  return Pinned.admitManifest({ bytes, pin, limits: bounds });
}

describe('Dist content admission', () => {
  it('matches an independently fixed UTF-8 preimage and SHA-256 vector', async () => {
    // These bytes/digest were calculated directly with WebCrypto, not the Dist encoder or builder.
    const preimage =
      '["sys.dist/v2",[["a.txt","sha256-559aead08264d5795d3909718cdd05abd49572e84fe55590eef31a88a08fdffd",1]]]';
    expect(Hash.sha256(preimage)).to.eql(digest);
    expect(Pkg.Dist.Content.encode(parts)).to.eql(preimage);
    const result = await admit(document());
    expect(result.kind).to.eql('manifest-admitted');
    if (result.kind !== 'manifest-admitted') throw new Error('Expected admitted inventory.');
    expect(result.evidence.content).to.eql({ ...pin, parts });
    expect(Object.keys(result.evidence).sort()).to.eql([
      'content',
      'manifestBytes',
      'manifestChecksum',
    ]);
    expect(Object.isFrozen(result.evidence.content.parts)).to.eql(true);
    expect(Object.isFrozen(result.evidence.content)).to.eql(true);
    expect(result.evidence.manifestChecksum).to.eql(Hash.sha256(document()));
  });

  it('fixes code-unit order, exact Unicode, numeric-looking and prototype-sensitive names', async () => {
    const value = `sha256-${'a'.repeat(64)}:size=0`;
    const inventory = Object.fromEntries(['\ue000', '😀', 'é', 'e\u0301', '__proto__', '2', '10']
      .map((path) => [path, value]));
    const expected: t.DistPin = {
      scheme: 'sys.dist/v2',
      digest: 'sha256-175151ad24d95c36ea3f1a6633c59dda8e7fd79e1fa291dbe1e4d44fba3d367f',
    };
    expect(new TextEncoder().encode(Pkg.Dist.Content.encode(inventory)).length).to.eql(608);
    expect(Hash.sha256(Pkg.Dist.Content.encode(inventory))).to.eql(expected.digest);
    const result = await Pinned.admitManifest({
      bytes: encoder.encode(Json.stringify({ hash: { ...expected, parts: inventory } }, 0)),
      pin: expected,
      limits,
    });
    if (result.kind !== 'manifest-admitted') throw new Error(`Expected admission: ${result.kind}`);
    expect(Obj.hasOwn(result.evidence.content.parts, '__proto__')).to.eql(true);
    expect(result.evidence.content.parts).to.eql(inventory);
  });

  it('metadata, root labels, layout and one BOM do not change content authority', async () => {
    const source = new TextDecoder().decode(document({
      pkg: { name: 'not-payload-authority', version: '99.0.0' },
      build: { time: -1, size: { total: 999 }, hash: { ignore: { rules: ['*a*a*a*a*'] } } },
      type: 'https://invalid.example/algorithm-selector',
    }));
    const changed = encoder.encode(`\ufeff \n${source}\n`);
    const first = await admit(document());
    const second = await admit(changed);
    if (first.kind !== 'manifest-admitted' || second.kind !== 'manifest-admitted') {
      throw new Error('Expected both document observations to admit.');
    }
    expect(first.evidence.content).to.eql(second.evidence.content);
    expect(first.evidence.manifestChecksum).not.to.eql(second.evidence.manifestChecksum);
    expect(second.evidence.manifestBytes).to.eql(changed.byteLength);
    expect('dist' in second.evidence).to.eql(false);
    expect('pkg' in second.evidence.content).to.eql(false);
    expect(await admit(encoder.encode(`\ufeff\ufeff${source}`))).to.eql({ kind: 'malformed' });
  });

  it('parses once with final-member authority, including escaped-equivalent keys', async () => {
    // Literal duplicate/escaped keys exercise native last-member-wins, not byte-exact layout.
    const text = Str.dedent(`
      {
        "hash": { "scheme": "bad" },
        "hash": {
          "scheme": "bad", "scheme": "sys.dist/v2",
          "digest": "bad", "di\\u0067est": "${digest}",
          "parts": {}, "parts": { "a.txt": "bad", "a\\u002etxt": "${parts['a.txt']}" }
        }
      }
    `);
    expect((await admit(encoder.encode(text))).kind).to.eql('manifest-admitted');
    const suffixes = [',"scheme":"bad"', ',"digest":"bad"', ',"parts":{}'];
    for (const suffix of suffixes) {
      const candidate = Str.dedent(`
        { "hash": {
          "scheme": "sys.dist/v2",
          "digest": "${digest}",
          "parts": { "a.txt": "${parts['a.txt']}" }${suffix}
        } }
      `);
      expect(await admit(encoder.encode(candidate))).to.eql({ kind: 'malformed' });
    }
  });

  it('never deep-copies or exposes deeply nested excluded observations', async () => {
    const depth = 20_000;
    const source = new TextDecoder().decode(document());
    const bytes = encoder.encode(
      `{"extension":${'['.repeat(depth)}null${']'.repeat(depth)},${source.slice(1)}`,
    );
    const result = await admit(bytes);
    expect(result.kind).to.eql('manifest-admitted');
    if (result.kind !== 'manifest-admitted') throw new Error('Expected bounded observation.');
    expect('extension' in result.evidence).to.eql(false);
    expect('extension' in result.evidence.content).to.eql(false);
    expect(await admit(bytes, { ...limits, manifestBytes: bytes.length - 1 }))
      .to.eql({ kind: 'limit-exceeded' });
  });

  it('refuses malformed UTF-8, JSON, old schemes, empty parts, and forged self reports', async () => {
    for (const bytes of [encoder.encode('{'), new Uint8Array([0xff, 0xfe])]) {
      expect(await admit(bytes)).to.eql({ kind: 'malformed' });
    }
    const invalid = [
      { digest, parts },
      { ...pin, scheme: 'sys.dist/v1', parts },
      { ...pin, scheme: 'sys.dist/v3', parts },
      { ...pin, parts: {} },
      { ...pin, digest: hashA, parts },
      { ...pin, parts: { 'a.txt': hashA } },
      { ...pin, parts: { 'a.txt': `${hashA}:size=01` } },
    ];
    for (const hash of invalid) {
      const bytes = encoder.encode(Json.stringify({ hash }, 0));
      const result = await admit(bytes);
      expect(result).to.eql({ kind: 'malformed' });
    }
  });

  it('a valid different path/content/length inventory cannot satisfy the retained pin', async () => {
    const inventories: readonly t.DistContent['parts'][] = [
      { 'b.txt': parts['a.txt'] },
      { 'a.txt': `${hashA}:size=2` },
      { 'a.txt': `sha256-${'0'.repeat(64)}:size=1` },
    ];
    for (const inventory of inventories) {
      const other = { scheme: pin.scheme, digest: Hash.sha256(Pkg.Dist.Content.encode(inventory)) };
      const bytes = encoder.encode(Json.stringify({ hash: { ...other, parts: inventory } }, 0));
      expect(await admit(bytes)).to.eql({ kind: 'pin-mismatch' });
      expect((await Pinned.admitManifest({ bytes, pin: other, limits })).kind).to.eql(
        'manifest-admitted',
      );
    }
  });

  it('preserves leading spaces but refuses aliases, reserved names, collisions, and malformed scalars', async () => {
    const invalid = [
      { './a.txt': parts['a.txt'] },
      { 'a//b': parts['a.txt'] },
      { '../a': parts['a.txt'] },
      { 'a\\b': parts['a.txt'] },
      { 'dist.json': parts['a.txt'] },
      { 'nested/DIST.JSON.SIG': parts['a.txt'] },
      { a: parts['a.txt'], 'a/b': parts['a.txt'] },
      { '\ud800': parts['a.txt'] },
    ];
    for (const inventory of invalid) {
      const bytes = encoder.encode(Json.stringify({ hash: { ...pin, parts: inventory } }, 0));
      expect(await admit(bytes)).to.eql({ kind: 'unsafe-path' });
    }
    const inventory = { ' a.js': parts['a.txt'], 'a.js': parts['a.txt'] };
    const expected = {
      scheme: pin.scheme,
      digest: Hash.sha256(Pkg.Dist.Content.encode(inventory)),
    };
    const bytes = encoder.encode(Json.stringify({ hash: { ...expected, parts: inventory } }, 0));
    const result = await Pinned.admitManifest({ bytes, pin: expected, limits });
    if (result.kind !== 'manifest-admitted') throw new Error('Expected space-sensitive paths.');
    expect(result.evidence.content.parts).to.eql(inventory);
  });

  it('checks caller string, directory-expansion, file and total budgets', async () => {
    const budgets = [
      { ...limits, pathLength: 4 },
      { ...limits, pathTotal: 4 },
      { ...limits, entries: 1 },
      { ...limits, fileBytes: 0 },
      { ...limits, totalBytes: 0 },
    ];
    for (const bounds of budgets) {
      expect(await admit(document(), bounds)).to.eql({ kind: 'limit-exceeded' });
    }
    const inventory = { 'a/b/c/d': parts['a.txt'] };
    const bytes = encoder.encode(Json.stringify({ hash: { ...pin, parts: inventory } }, 0));
    expect(await admit(bytes, { ...limits, entries: 4 })).to.eql({ kind: 'limit-exceeded' });
    // Seven input path units, but 1 + 3 + 5 prefix units: bound before slicing/normalization.
    expect(await admit(bytes, { ...limits, pathTotal: 8 })).to.eql({ kind: 'limit-exceeded' });
    const expected = {
      scheme: pin.scheme,
      digest: Hash.sha256(Pkg.Dist.Content.encode(inventory)),
    };
    const bounded = encoder.encode(Json.stringify({ hash: { ...expected, parts: inventory } }, 0));
    const withinBudget = await Pinned.admitManifest({
      bytes: bounded,
      pin: expected,
      limits: { ...limits, entries: 5, pathTotal: 9 },
    });
    expect(withinBudget.kind).to.eql('manifest-admitted');
    for (const bounds of [{ ...limits, pathLength: 0 }, { ...limits, pathTotal: NaN }]) {
      expect(await admit(document(), bounds)).to.eql({ kind: 'invalid-input' });
    }
  });

  it('caller limits cannot raise the shared manifest ceiling; exact-cap bytes still admit', async () => {
    const cap = D.contentLimits.manifestBytes;
    expect(cap).to.eql(16 * 1024 * 1024);
    expect(D.contentLimits.entries).to.eql(Pkg.Dist.Content.limits.entries);
    const raised = { ...limits, manifestBytes: Num.MAX_INT, entries: Num.MAX_INT };
    const snapshot = snapshotVerifyLimits(raised);
    expect(snapshot?.manifestBytes).to.eql(cap);
    expect(snapshot?.entries).to.eql(Pkg.Dist.Content.limits.entries);

    // Trailing JSON whitespace preserves the valid document at the exact byte boundary.
    const bytes = new Uint8Array(cap + 1).fill(0x20);
    bytes.set(document());
    expect((await admit(bytes.subarray(0, cap), raised)).kind).to.eql('manifest-admitted');
    expect(await admit(bytes, raised)).to.eql({ kind: 'limit-exceeded' });

    // Parsing also enforces the ceiling when called without the public input snapshot.
    let caught: unknown;
    try {
      parseManifestBytes(bytes, raised);
    } catch (cause) {
      caught = cause;
    }
    if (!isFailure(caught)) throw new Error('Expected bounded parser refusal.');
    expect(caught.kind).to.eql('limit-exceeded');
  });

  it('old, mixed, malformed, accessor and proxy pins refuse before filesystem acquisition', async () => {
    let calls = 0;
    const io = {
      ...DEFAULT_IO,
      async lstat(path: string) {
        calls++;
        return await DEFAULT_IO.lstat(path);
      },
    };
    const accessor = Object.defineProperty({ scheme: pin.scheme }, 'digest', {
      get() {
        calls++;
        return digest;
      },
    });
    const invalid = [
      { integrity: Hash.sha256(document()) },
      { pin, integrity: Hash.sha256(document()) },
      { pin: { 'dist.json': digest } },
      { pin: { ...pin, 'dist.json': digest } },
      { pin: { ...pin, scheme: 'sys.dist/v3' } },
      { pin: accessor },
      {
        pin: new Proxy(pin, {
          get() {
            calls++;
            throw new Error('Do not access.');
          },
        }),
      },
    ];
    for (const candidate of invalid) {
      expect(await verifyPinnedWithIo({ dir: '.', limits, ...candidate }, io))
        .to.eql({ kind: 'invalid-input' });
    }
    expect(calls).to.eql(0);
  });

  it('snapshots caller pin and bytes before asynchronous work', async () => {
    const bytes = document();
    const expected = { ...pin };
    const pending = Pinned.admitManifest({ bytes, pin: expected, limits });
    expected.digest = hashA;
    bytes.fill(0);
    const result = await pending;
    if (result.kind !== 'manifest-admitted') throw new Error('Expected captured input.');
    expect(result.evidence.content).to.eql({ ...pin, parts });
  });
});
