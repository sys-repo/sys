import { describe, expect, it, pkg, type t } from '../../-test.ts';
import {
  Inventory as VerifyInventory,
  Local as VerifyLocal,
  Pinned as VerifyPinned,
} from '@sys/fs/pkg/dist/verify';
import { distTypePath as typesDistTypePath } from '@sys/types';
import { pkg as fsPkg } from '../../pkg.ts';
import { Dir } from '../../mod.ts';
import { Sample } from './-u.dist.fixture.ts';
import { D, Err, Fs, Hash, Is, Json, JsrUrl, Obj, Path, Str, Time } from '../common.ts';
import { Dist } from '../m.Dist.ts';
import { Pkg } from '../../m.Pkg/mod.ts';
import { limits } from './-u.pinned.fixture.ts';

/** Successful fixture authorship; refusal cases call the public producer directly. */
async function compute(args: t.Pkg.Dist.Compute.Args) {
  const result = await Pkg.Dist.compute(args);
  if (result.kind !== 'computed') throw result.error;
  return result;
}

describe('Pkg.Dist', () => {
  it('public surfaces → same owner implementations, no old consistency or conversion API', async () => {
    const { Pkg: Base } = await import('@sys/std/pkg');
    expect(Pkg.Dist).to.equal(Dist);
    expect(Pkg.Dist).not.to.equal(Base.Dist);
    expect(VerifyLocal).to.equal(Dist.Local);
    expect(VerifyPinned).to.equal(Dist.Pinned);
    expect(VerifyInventory).to.equal(Dist.Inventory);
    expect(Object.keys(Pkg.Dist.Local).sort()).to.eql(['readPart', 'verify']);
    expect(Object.keys(Pkg.Dist.Pinned).sort()).to.eql(['admitManifest', 'readPart', 'verify']);
    expect([Base.Dist, Dist.Local, Dist.Pinned].every(Object.isFrozen)).to.eql(true);
    expect(Object.keys(Pkg.Dist).sort()).to.eql([
      ...Object.keys(Base.Dist),
      'Inventory',
      'Log',
      'Local',
      'Pinned',
      'compute',
      'project',
      'load',
    ].sort());
    expect(Pkg.Dist.Pins.capture).to.equal(Base.Dist.Pins.capture);
    for (const key of Obj.keys(Base.Dist)) {
      if (key !== 'Pins') expect(Pkg.Dist[key]).to.equal(Base.Dist[key]);
    }
    expect('checkSelfReported' in Dist).to.eql(false);
    expect('Compat' in Dist).to.eql(false);
  });

  it('selected own filenames → generic collection and Dist retain identical membership, distinct digests', async () => {
    const dir = (await Fs.makeTempDir({ prefix: 'Fs.Pkg.own-keys.' })).absolute;
    try {
      const files = [
        { path: '__proto__', bytes: new Uint8Array([1]) },
        { path: 'constructor', bytes: new Uint8Array([2, 3]) },
        { path: 'toString', bytes: new Uint8Array([4, 5, 6]) },
        { path: 'z.txt', bytes: new Uint8Array([7, 8, 9, 10]) },
      ];
      for (const file of files) {
        await Fs.write(Fs.join(dir, file.path), file.bytes, { throw: true });
      }
      await Fs.write(Fs.join(dir, 'skip.txt'), 'not selected', { throw: true });
      const filter = (path: string) => Path.basename(path) !== 'skip.txt';
      const parts = Object.fromEntries(files.map(({ path, bytes }) => [
        path,
        `${Hash.sha256(bytes)}:size=${bytes.byteLength}`,
      ]));
      const genericDigest = Hash.sha256(files.map(({ bytes }) => Hash.sha256(bytes)).join('\n'));
      const tuples = files.map(({ path, bytes }) => [path, Hash.sha256(bytes), bytes.byteLength]);
      const digest = Hash.sha256(Json.stringify(['sys.dist/v2', tuples], 0).trimEnd());
      const collected = await Dir.Hash.compute(dir, { filter });
      const computed = await compute({ dir, filter, save: true });
      const loaded = await Pkg.Dist.load(dir);
      expect(collected.error).to.eql(undefined);
      expect(loaded.kind).to.eql('canonical');
      if (!loaded.dist) throw new Error('Expected saved Dist fixture.');
      expect(collected.hash).to.eql({ digest: genericDigest, parts });
      expect(digest).not.to.eql(genericDigest);
      for (const hash of [computed.dist.hash, loaded.dist.hash]) {
        expect(hash).to.eql({ scheme: 'sys.dist/v2', digest, parts });
        expect(Obj.keys(hash.parts).sort()).to.eql(files.map(({ path }) => path));
        for (const { path } of files) expect(Obj.hasOwn(hash.parts, path)).to.eql(true);
      }
      expect(computed.dist.build.size.total).to.eql(10);
      const text = await Fs.readText(Fs.join(dir, 'dist.json'));
      expect(text.error).to.eql(undefined);
      expect(text.data).to.eql(Json.stringify(computed.dist, 2));
      expect(computed.manifestChecksum).to.eql(Hash.sha256(text.data));
      const changedBytes = new Uint8Array([11]);
      await Fs.write(Fs.join(dir, '__proto__'), changedBytes, { throw: true });
      const changed = await compute({ dir, filter });
      expect(Obj.hasOwn(changed.dist.hash.parts, '__proto__')).to.eql(true);
      expect(changed.dist.hash.parts['__proto__']).to.eql(`${Hash.sha256(changedBytes)}:size=1`);
      expect(changed.pin.digest).not.to.eql(digest);
      expect(loaded.dist.hash.parts['__proto__']).to.eql(parts['__proto__']);
    } finally {
      await Fs.remove(dir);
    }
  });

  it('compute → supported descriptor, derived totals and descriptive build metadata', async () => {
    const sample = await Sample.init();
    const { dir } = sample.path;
    const pkg = { name: 'my-package', version: '0.0.0' };
    const builder = { name: 'my-builder', version: '0.0.0' };
    const res = await compute({ dir, pkg, builder });
    const { dist } = res;
    expect(res.exists).to.eql(true);
    expect(res.error).to.eql(undefined);
    expect(res.dir).to.eql(Fs.resolve(dir));
    expect(res.manifestChecksum).to.eql(Hash.sha256(Json.stringify(dist, 2)));
    expect(res.pin).to.eql({ scheme: dist.hash.scheme, digest: dist.hash.digest });
    expect(dist.type.startsWith('https://jsr.io/@sys/types')).to.eql(true);
    expect(dist.type.endsWith(typesDistTypePath)).to.eql(true);
    expect(dist.pkg).to.eql(pkg);
    expect(dist.build.time).to.be.closeTo(Time.now.timestamp, 100);
    expect(dist.build.builder).to.eql(Pkg.toString(builder));
    for (const key of ['deno=', 'v8=', 'typescript=']) {
      expect(dist.build.runtime.includes(key)).to.eql(true);
    }
    expect(dist.build.hash.policy).to.eql(JsrUrl.Pkg.file(fsPkg, D.hashPolicy.path));
    expect(await Fs.exists(Fs.resolve(`./${D.hashPolicy.path}`))).to.eql(true);
    expect(Is.number(dist.build.size.total)).to.eql(true);
    expect(Is.number(dist.build.size.pkg)).to.eql(true);
    const dirhash = await Dir.Hash.compute(dir);
    expect(dist.hash.parts).to.eql(dirhash.hash.parts);
    expect(dist.hash.digest).not.to.eql(dirhash.hash.digest);
  });

  it('custom filter → exact parent selection in addition to manifest exclusion', async () => {
    const { path: { dir } } = await Sample.init();
    await Fs.write(Fs.join(dir, 'ignore.me'), 'ignored');
    const filter = (path: string) => Path.basename(path) !== 'ignore.me';
    const res = await compute({ dir, pkg, filter });
    const dirhash = await Dir.Hash.compute(dir, { filter });
    expect(res.dist.hash.parts).to.eql(dirhash.hash.parts);
    expect(Obj.hasOwn(res.dist.hash.parts, 'ignore.me')).to.eql(false);
    expect(res.dist.hash.digest).not.to.eql(dirhash.hash.digest);
  });

  it('hash progress → one ordered event per selected file', async () => {
    const { path: { dir } } = await Sample.init();
    const events: t.Dir.Hash.Compute.ProgressEvent[] = [];
    const res = await compute({
      dir,
      onHashProgress(e) {
        events.push(e);
      },
    });
    expect(events.length).to.eql(Object.keys(res.dist.hash.parts).length);
    expect(events.length).to.be.greaterThan(0);
    expect(events[0]?.current).to.eql(1);
    expect(events[events.length - 1]?.current).to.eql(events.length);
    expect(events.every((e) => e.total === events.length)).to.eql(true);
  });

  it('root manifest and signature bytes → excluded across repeated saves', async () => {
    const { path: { dir } } = await Sample.init();
    await Fs.write(Fs.join(dir, 'dist.json.sig'), 'sig-v1');
    const first = await compute({ dir, pkg, save: true });
    await Fs.write(Fs.join(dir, 'dist.json.sig'), 'sig-v2');
    const second = await compute({ dir, pkg, save: true });
    const third = await compute({ dir, pkg, save: true });
    expect(first.dist.hash).to.eql(second.dist.hash);
    expect(second.dist.hash).to.eql(third.dist.hash);
    for (const path of ['dist.json', './dist.json', 'dist.json.sig', './dist.json.sig']) {
      expect(Obj.hasOwn(second.dist.hash.parts, path)).to.eql(false);
    }
  });

  it('ignore policy → selected inventory plus descriptive rules and digest', async () => {
    const { path: { dir } } = await Sample.init();
    await Fs.write(Fs.join(dir, '.DS_Store'), 'junk');
    const strict = await compute({ dir, pkg });
    const scoped = await compute({ dir, pkg, ignore: ['.DS_Store'] });
    const defaults = strict.dist.build.hash.ignore;
    expect(defaults?.format).to.eql('gitignore');
    expect(defaults?.rules).to.eql(['dist.json', 'dist.json.sig']);
    expect(defaults?.['rules:digest'].startsWith('sha256-')).to.eql(true);
    expect(defaults?.['rules:digest'].length).to.eql(71);
    expect(Obj.hasOwn(strict.dist.hash.parts, '.DS_Store')).to.eql(true);
    expect(Obj.hasOwn(scoped.dist.hash.parts, '.DS_Store')).to.eql(false);
    expect(scoped.dist.build.hash.ignore?.rules).to.eql([
      'dist.json',
      'dist.json.sig',
      '.DS_Store',
    ]);
    expect(scoped.dist.build.hash.ignore?.['rules:digest']).not.to.eql(defaults?.['rules:digest']);
  });

  it('omitted root package → supported save/load and unknown descriptive builder', async () => {
    const { path: { dir, filepath } } = await Sample.init();
    const res = await compute({ dir, save: true });
    expect(res.dist.pkg).to.eql(undefined);
    expect(Pkg.Is.unknown(res.dist.build.builder)).to.eql(true);
    const json = (await Fs.readJson<Record<string, unknown>>(filepath)).data;
    if (!json) throw new Error('Expected document.');
    expect(Obj.hasOwn(json, 'pkg')).to.eql(false);
    const loaded = await Pkg.Dist.load(dir);
    expect(loaded.kind).to.eql('canonical');
    expect(loaded.dist?.pkg).to.eql(undefined);
  });

  it('save option → exact document bytes or no filesystem write', async () => {
    const { path: { dir, filepath } } = await Sample.init();
    expect(await Fs.exists(filepath)).to.eql(false);
    const observed = await compute({ dir, pkg });
    expect(await Fs.exists(filepath)).to.eql(false);
    expect(observed.manifestChecksum).to.eql(Hash.sha256(Json.stringify(observed.dist, 2)));
    const saved = await compute({ dir, pkg, save: true });
    expect((await Fs.readJson(filepath)).data).to.eql(saved.dist);
    const text = (await Fs.readText(filepath)).data ?? '';
    expect(text.endsWith('\n')).to.eql(true);
    expect(text.endsWith('\n\n')).to.eql(false);
    expect(saved.manifestChecksum).to.eql(Hash.sha256((await Fs.read(filepath)).data));
    expect(saved.pin).to.eql(observed.pin);
  });

  it('missing directory or regular-file root → truthful failure without a document or pin', async () => {
    const root = (await Fs.makeTempDir({ prefix: 'Dist.refused-root.' })).absolute;
    const file = Fs.join(root, 'file');
    const cases = [
      { dir: Fs.join(root, 'missing'), exists: false, cause: 'Dist directory does not exist.' },
      { dir: file, exists: true, cause: 'Dist path is not a directory.' },
    ];
    try {
      await Fs.write(file, 'not a directory', { throw: true });
      for (const { dir, exists, cause } of cases) {
        const res = await Pkg.Dist.compute({ dir, pkg, save: true });
        expect(res.kind).to.eql('failed');
        if (res.kind !== 'failed') throw new Error('Expected refused Dist root.');
        expect(res.dir).to.eql(dir);
        expect(res.exists).to.eql(exists);
        expect(res.error.message).to.eql('Dist computation failed.');
        expect(res.error.cause?.message).to.eql(cause);
        expect(Err.summary(res.error, { cause: true })).to.include(cause);
        expect('dist' in res).to.eql(false);
        expect('pin' in res).to.eql(false);
        expect('manifestChecksum' in res).to.eql(false);
      }
      expect(await Fs.exists(cases[0].dir)).to.eql(false);
      expect((await Fs.readText(file)).data).to.eql('not a directory');
      const entries = await Fs.glob(root, { includeDirs: true }).find('**/*');
      expect(entries.map((entry) => Path.basename(entry.path))).to.eql(['file']);
    } finally {
      await Fs.remove(root);
    }
  });

  it('child reuse → selected content only, stable across child document/signature changes', async () => {
    const root = (await Fs.makeTempDir({ prefix: 'Dist.child.' })).absolute;
    try {
      const childDir = Fs.join(root, 'child');
      await Fs.ensureDir(childDir);
      await Fs.write(Fs.join(childDir, 'a.txt'), 'v1');
      const child = await compute({ dir: childDir, pkg, save: true });
      const first = await compute({ dir: root, trustChildDist: true, save: true });
      const direct = await compute({ dir: root });
      expect(first.dist.hash).to.eql(direct.dist.hash);
      expect(first.dist.hash.parts['child/a.txt']).to.eql(child.dist.hash.parts['a.txt']);
      expect(Obj.hasOwn(first.dist.hash.parts, 'child/dist.json')).to.eql(false);
      expect(Obj.hasOwn(first.dist.hash.parts, 'child/dist.json.sig')).to.eql(false);
      await compute({ dir: childDir, pkg: { name: 'changed', version: '2' }, save: true });
      await Fs.write(Fs.join(childDir, 'dist.json.sig'), 'not-payload');
      const second = await compute({ dir: root, trustChildDist: true, save: true });
      const third = await compute({ dir: root, trustChildDist: true, save: true });
      expect(second.dist.hash).to.eql(first.dist.hash);
      expect(third.pin).to.eql(first.pin);
      // A producer inventory is not whole-tree proof: excluded child documents remain on disk.
      const verification = await Pkg.Dist.Pinned.verify({
        dir: await Deno.realPath(root),
        pin: first.pin,
        limits,
      });
      expect(verification).to.eql({ kind: 'unexpected-entry' });
    } finally {
      await Fs.remove(root);
    }
  });

  it('sibling file sharing a child prefix → retained during child reuse', async () => {
    const root = (await Fs.makeTempDir({ prefix: 'Dist.sibling.' })).absolute;
    try {
      await Fs.ensureDir(Fs.join(root, 'editor'));
      await Fs.write(Fs.join(root, 'editor/worker.js'), 'worker');
      await Fs.write(Fs.join(root, 'editor.js'), 'editor');
      const child = await compute({ dir: Fs.join(root, 'editor'), save: true });
      const parent = await compute({ dir: root, trustChildDist: true });
      expect(parent.dist.hash.parts['editor/worker.js']).to.eql(child.dist.hash.parts['worker.js']);
      expect(Obj.hasOwn(parent.dist.hash.parts, 'editor.js')).to.eql(true);
    } finally {
      await Fs.remove(root);
    }
  });

  it('unsupported child manifest → refusal, no file-hashing fallback or publication', async () => {
    const root = (await Fs.makeTempDir({ prefix: 'Dist.invalid-child.' })).absolute;
    try {
      await Fs.ensureDir(Fs.join(root, 'child'));
      await Fs.write(Fs.join(root, 'child/a.txt'), 'v1');
      await Fs.write(Fs.join(root, 'child/dist.json'), '{"not":"a-dist"}\n');
      const result = await Pkg.Dist.compute({ dir: root, trustChildDist: true, save: true });
      expect(result.kind).to.eql('failed');
      expect('pin' in result).to.eql(false);
      expect(await Fs.exists(Fs.join(root, 'dist.json'))).to.eql(false);
    } finally {
      await Fs.remove(root);
    }
  });

  it('Log.children → nested content directories are not double-counted', async () => {
    const root = (await Fs.makeTempDir({ prefix: 'Dist.log.' })).absolute;
    try {
      const childDir = Fs.join(root, 'sys/dev');
      await Fs.ensureDir(childDir);
      await Fs.write(Fs.join(childDir, 'hello.txt'), 'child');
      await compute({ dir: childDir, pkg: { name: '@child/dev', version: '0.0.0' }, save: true });
      await Fs.ensureDir(Fs.join(root, 'static/runtime'));
      await Fs.write(Fs.join(root, 'static/README.md'), 'readme');
      await Fs.write(Fs.join(root, 'static/runtime/a.bin'), 'a'.repeat(10));
      await Fs.write(Fs.join(root, 'static/runtime/b.bin'), 'b'.repeat(20));
      const { dist } = await compute({ dir: root, pkg });
      const text = await Pkg.Dist.Log.children(root, dist);
      const line = text.split('\n').find((line) => line.includes('static content'));
      expect(line?.match(/(\d+(?:\.\d+)?\s*(?:B|KB|MB|GB))\s*$/)?.[1]).to.eql(Str.bytes(36));
    } finally {
      await Fs.remove(root);
    }
  });

  it('Log.dist without root package → descriptive builder and content digest', async () => {
    const { path: { dir } } = await Sample.init();
    const { dist } = await compute({ dir });
    const text = Pkg.Dist.Log.dist(dist);
    expect(text.includes('digest:')).to.eql(true);
    expect(text.includes('builder:')).to.eql(true);
  });

  it('load directory or manifest filepath → same supported observation', async () => {
    const sample = await Sample.init();
    await sample.file.dist.ensure();
    for (const path of [sample.path.dir, sample.path.filepath]) {
      const res = await Pkg.Dist.load(path);
      expect(res.path).to.eql(Fs.resolve(sample.path.filepath));
      expect(res.exists).to.eql(true);
      expect(res.kind).to.eql('canonical');
      expect(res.error).to.eql(undefined);
      expect(res.dist?.pkg).to.eql(pkg);
    }
  });

  it('missing document → missing observation', async () => {
    const res = await Pkg.Dist.load('404_foobar');
    expect(res.exists).to.eql(false);
    expect(res.kind).to.eql('missing');
    expect(res.dist).to.eql(undefined);
    expect(res.error).not.to.eql(undefined);
  });

  it('partial or legacy document → invalid, never converted', async () => {
    const sample = await Sample.init();
    const legacy = {
      type: 'https://jsr.io/@sys/types/0.0.100/src/types/t.Pkg.dist.ts',
      pkg: { name: '@sample/legacy', version: '0.0.1' },
      build: {
        time: 1,
        size: { total: 1, pkg: 1 },
        builder: '@sample/legacy@0.0.1',
        runtime: 'old',
      },
      hash: { digest: 'sha256-deadbeef', parts: { './index.js': 'sha256-deadbeef' } },
    };
    for (const value of [{ type: 'x', build: {} }, legacy]) {
      await Fs.writeJson(sample.path.filepath, value, { throw: true });
      const res = await Pkg.Dist.load(sample.path.dir);
      expect(res.exists).to.eql(true);
      expect(res.kind).to.eql('invalid');
      expect(res.dist).to.eql(undefined);
      expect('legacy' in res).to.eql(false);
      expect(res.error).not.to.eql(undefined);
    }
  });

  it('Local.verify → supported unpinned consistency, no ignore-policy authority', async () => {
    const sample = await Sample.init();
    const dir = await Deno.realPath(sample.path.dir);
    const computed = await compute({ dir, pkg, save: true });
    const altered = {
      ...computed.dist,
      build: {
        ...computed.dist.build,
        hash: { policy: 'ignored', ignore: { rules: ['*'], 'rules:digest': 'bad' } },
      },
    };
    await Fs.writeJson(Fs.join(dir, 'dist.json'), altered, { throw: true });
    const result = await Pkg.Dist.Local.verify({ dir, limits });
    if (result.kind !== 'verified') throw new Error(`Expected local consistency: ${result.kind}`);
    expect(result.evidence.content).to.eql(computed.dist.hash);
    await Fs.write(Fs.join(dir, 'index.html'), 'changed');
    expect(await Pkg.Dist.Local.verify({ dir, limits })).to.eql({ kind: 'content-mismatch' });
    await Fs.remove(Fs.join(dir, 'dist.json'));
    expect(await Pkg.Dist.Local.verify({ dir, limits })).to.eql({ kind: 'missing' });
    expect(await Pkg.Dist.Local.verify({ dir: Fs.join(dir, 'missing'), limits })).to.eql({
      kind: 'missing',
    });
  });
});
