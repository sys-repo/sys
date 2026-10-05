import { describe, expect, it, Json, Num, type t } from '../../-test.ts';
import { Pkg } from '../../m.Pkg/mod.ts';
import { cloneDist, limits, setup, teardown, writeManifest } from './-u.pinned.fixture.ts';

const decoder = new TextDecoder();
const encoder = new TextEncoder();

describe('Pkg.Dist.Pinned.verify manifest admission', () => {
  it('invalid caller pin or limits → invalid-input; valid different pin → pin-mismatch', async () => {
    const fixture = await setup();
    try {
      const malformedPin = await Pkg.Dist.Pinned.verify({
        dir: fixture.dir,
        pin: { scheme: 'sys.dist/v2', digest: 'sha256-nope' },
        limits,
      });
      expect(malformedPin).to.eql({ kind: 'invalid-input' });
      const wrongPin = await Pkg.Dist.Pinned.verify({
        dir: fixture.dir,
        pin: { scheme: 'sys.dist/v2', digest: `sha256-${'0'.repeat(64)}` },
        limits,
      });
      expect(wrongPin).to.eql({ kind: 'pin-mismatch' });
      const invalidLimits = await Pkg.Dist.Pinned.verify({
        dir: fixture.dir,
        pin: fixture.pin,
        limits: { ...limits, entries: 0 },
      });
      expect(invalidLimits).to.eql({ kind: 'invalid-input' });
    } finally {
      await teardown(fixture);
    }
  });

  it('invalid UTF-8, JSON, old or unsafe descriptor shapes → malformed', async () => {
    const fixture = await setup();
    try {
      const shapes: readonly unknown[] = [
        { type: 'x', build: {}, hash: {} },
        { ...fixture.dist, hash: [] },
        { ...fixture.dist, hash: { ...fixture.dist.hash, scheme: undefined } },
        { ...fixture.dist, hash: { ...fixture.dist.hash, scheme: 'sys.dist/v1' } },
        { ...fixture.dist, hash: { ...fixture.dist.hash, parts: [] } },
      ];
      const variants = [
        new Uint8Array([0xff, 0xfe, 0xfd]),
        encoder.encode('{'),
        ...shapes.map((value) => encoder.encode(Json.stringify(value))),
      ];
      for (const bytes of variants) {
        await Deno.writeFile(`${fixture.dir}/dist.json`, bytes);
        const result = await Pkg.Dist.Pinned.verify({ dir: fixture.dir, pin: fixture.pin, limits });
        expect(result).to.eql({ kind: 'malformed' });
      }
    } finally {
      await teardown(fixture);
    }
  });

  it('deep excluded metadata → no authenticated extension or recursive copy', async () => {
    const fixture = await setup();
    try {
      const depth = 20_000;
      const source = decoder.decode(fixture.manifest);
      const text = `{"extension":${'['.repeat(depth)}null${']'.repeat(depth)},${source.slice(1)}`;
      await Deno.writeFile(`${fixture.dir}/dist.json`, encoder.encode(text));
      const result = await Pkg.Dist.Pinned.verify({ dir: fixture.dir, pin: fixture.pin, limits });
      if (result.kind !== 'verified') throw new Error(`Expected verification: ${result.kind}`);
      expect(result.evidence.content).to.eql(fixture.dist.hash);
      expect('extension' in result.evidence).to.eql(false);
      expect('dist' in result.evidence).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('missing part lengths, forged digests or empty inventory → malformed', async () => {
    const fixture = await setup();
    try {
      const noSize = cloneDist(fixture.dist);
      const path = Object.keys(noSize.hash.parts)[0];
      noSize.hash.parts[path] = Pkg.Dist.Part.hash(noSize.hash.parts[path])!;
      const badDigest = cloneDist(fixture.dist);
      badDigest.hash.digest = `sha256-${'0'.repeat(64)}`;
      const noParts = cloneDist(fixture.dist);
      noParts.hash.parts = {};
      for (const dist of [noSize, badDigest, noParts]) {
        await writeManifest(fixture.dir, dist);
        const result = await Pkg.Dist.Pinned.verify({ dir: fixture.dir, pin: fixture.pin, limits });
        expect(result).to.eql({ kind: 'malformed' });
      }
    } finally {
      await teardown(fixture);
    }
  });

  it('ignore policy, totals and root labels → observations, not verification instructions', async () => {
    const fixture = await setup();
    try {
      const observations: readonly unknown[] = [
        { ...fixture.dist, build: [] },
        { ...fixture.dist, build: { hash: [] } },
        { ...fixture.dist, build: { hash: undefined } },
        { ...fixture.dist, pkg: { name: 'different', version: '9.0.0' } },
        { hash: fixture.dist.hash },
      ];
      for (const value of observations) {
        await Deno.writeTextFile(`${fixture.dir}/dist.json`, Json.stringify(value));
        const result = await Pkg.Dist.Pinned.verify({ dir: fixture.dir, pin: fixture.pin, limits });
        if (result.kind !== 'verified') throw new Error(`Expected verification: ${result.kind}`);
        expect(result.evidence.content).to.eql(fixture.dist.hash);
        expect(result.evidence.assets.totalBytes).to.eql(fixture.dist.build.size.total);
      }
      // These patterns must never be executed, including previously ambiguous wildcards.
      for (const rule of [' assets/private ', 'assets/app.js', '**/*.map', 'a/**/**/zz', '*a*a']) {
        const dist = cloneDist(fixture.dist);
        dist.build.size = { total: -1, pkg: -1 };
        dist.build.hash = {
          policy: 'not-a-url',
          ignore: { format: 'gitignore', rules: [rule], 'rules:digest': 'wrong' },
        };
        await writeManifest(fixture.dir, dist);
        const result = await Pkg.Dist.Pinned.verify({ dir: fixture.dir, pin: fixture.pin, limits });
        expect(result.kind).to.eql('verified');
      }
    } finally {
      await teardown(fixture);
    }
  });

  it('noncanonical, reserved or structurally conflicting paths → unsafe-path', async () => {
    const fixture = await setup();
    try {
      const firstPath = Object.keys(fixture.dist.hash.parts)[0];
      const firstPart = fixture.dist.hash.parts[firstPath];
      for (const path of [`./${firstPath}`, 'nested/dist.json', 'assets', 'dist.json/child']) {
        const dist = cloneDist(fixture.dist);
        if (path !== 'assets') delete dist.hash.parts[firstPath];
        dist.hash.parts[path] = firstPart;
        await writeManifest(fixture.dir, dist);
        const result = await Pkg.Dist.Pinned.verify({ dir: fixture.dir, pin: fixture.pin, limits });
        expect(result, path).to.eql({ kind: 'unsafe-path' });
      }
    } finally {
      await teardown(fixture);
    }
  });

  it('signature path and key hints → inert, even when naming an inventoried asset', async () => {
    const fixture = await setup();
    try {
      for (const path of ['dist.json.sig', 'index.html', '../outside.sig']) {
        const dist = cloneDist(fixture.dist);
        delete dist.pkg;
        dist.build.sign = { path, scheme: 'Ed25519', key: 'not-a-trust-root' };
        await writeManifest(fixture.dir, dist);
        const result = await Pkg.Dist.Pinned.verify({ dir: fixture.dir, pin: fixture.pin, limits });
        expect(result.kind).to.eql('verified');
      }
    } finally {
      await teardown(fixture);
    }
  });

  it('declared-part boundary → malformed within limit, bounded refusal beyond it', async () => {
    const fixture = await setup();
    try {
      const paths = Object.keys(fixture.dist.hash.parts);
      const atLimit = cloneDist(fixture.dist);
      atLimit.hash.parts[paths[paths.length - 1]] = 'malformed';
      await writeManifest(fixture.dir, atLimit);
      const withinLimit = await Pkg.Dist.Pinned.verify({
        dir: fixture.dir,
        pin: fixture.pin,
        limits: { ...limits, entries: paths.length },
      });
      expect(withinLimit).to.eql({ kind: 'malformed' });
      const excess = cloneDist(fixture.dist);
      excess.hash.parts[paths[1]] = 'malformed';
      await writeManifest(fixture.dir, excess);
      const beyondLimit = await Pkg.Dist.Pinned.verify({
        dir: fixture.dir,
        pin: fixture.pin,
        limits: { ...limits, entries: 1 },
      });
      expect(beyondLimit).to.eql({ kind: 'limit-exceeded' });
    } finally {
      await teardown(fixture);
    }
  });

  it('caller resource limits and unsafe arithmetic → bounded refusal', async () => {
    const fixture = await setup();
    try {
      const budgets: t.Pkg.Dist.Verify.Limits[] = [
        { ...limits, manifestBytes: fixture.manifest.byteLength - 1 },
        { ...limits, fileBytes: 1 },
        { ...limits, totalBytes: 1 },
        { ...limits, entries: 3 },
      ];
      for (const budget of budgets) {
        const result = await Pkg.Dist.Pinned.verify({
          dir: fixture.dir,
          pin: fixture.pin,
          limits: budget,
        });
        expect(result).to.eql({ kind: 'limit-exceeded' });
      }
      const dist = cloneDist(fixture.dist);
      for (const [path, part] of Object.entries(dist.hash.parts)) {
        dist.hash.parts[path] = `${Pkg.Dist.Part.hash(part)!}:size=${Num.MAX_INT}`;
      }
      await writeManifest(fixture.dir, dist);
      const overflow = await Pkg.Dist.Pinned.verify({
        dir: fixture.dir,
        pin: fixture.pin,
        limits: { ...limits, fileBytes: Num.MAX_INT, totalBytes: Num.MAX_INT },
      });
      expect(overflow).to.eql({ kind: 'limit-exceeded' });
    } finally {
      await teardown(fixture);
    }
  });
});
