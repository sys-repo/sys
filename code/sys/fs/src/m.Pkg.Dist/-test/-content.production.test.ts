import { describe, expect, Hash, it, Json, type t } from '../../-test.ts';
import { Fs, Obj } from '../common.ts';
import { Pkg } from '../../m.Pkg/mod.ts';
import { DirHash } from '../../m.Dir.Hash/mod.ts';
import { DEFAULT_IO } from '../u.verify/u.io.ts';
import { verifyPinnedWithIo } from '../u.verify/u.verify.ts';

const limits: t.Pkg.Dist.Verify.Limits = {
  manifestBytes: 1_048_576,
  entries: 100,
  fileBytes: 4096,
  totalBytes: 16_384,
};

async function directory() {
  return await Deno.realPath(await Deno.makeTempDir({ prefix: 'Dist.content.' }));
}

async function computed(dir: string, options: Omit<t.Pkg.Dist.Compute.Args, 'dir'> = {}) {
  const result = await Pkg.Dist.compute({ dir, save: true, ...options });
  if (result.kind !== 'computed') throw result.error;
  return result;
}

describe('Dist content production and actual-byte verification', () => {
  it('normal computation → the literal pin, distinct from generic directory hashing', async () => {
    const dir = await directory();
    try {
      await Deno.writeTextFile(`${dir}/a.txt`, 'A');
      const first = await computed(dir, { pkg: { name: 'first', version: '1.0.0' } });
      expect(first.pin).to.eql({
        scheme: 'sys.dist/v2',
        digest: 'sha256-c3e2a19d508cf0cd7a8dd88f13a2ba87cf2f29317732dab555a81c9e02c3a045',
      });
      expect(first.dist.hash.digest).to.eql(first.pin.digest);
      const noChildren = await computed(dir, { trustChildDist: true, save: false });
      expect(noChildren.dist.hash).to.eql(first.dist.hash);
      const generic = await DirHash.compute(dir, {
        filter: (path) => !path.endsWith('/dist.json'),
      });
      expect(generic.hash.parts).to.eql(first.dist.hash.parts);
      expect(generic.hash.digest).not.to.eql(first.pin.digest);
      const second = await computed(dir, { pkg: { name: 'second', version: '9.0.0' } });
      expect(second.pin).to.eql(first.pin);
      expect(second.manifestChecksum).not.to.eql(first.manifestChecksum);
      const loaded = await Pkg.Dist.load(dir);
      expect(loaded.kind).to.eql('canonical');
      expect(loaded.dist?.hash).to.eql(second.dist.hash);
      const verified = await Pkg.Dist.Pinned.verify({ dir, pin: first.pin, limits });
      if (verified.kind !== 'verified') throw new Error(`Expected verified: ${verified.kind}`);
      expect(verified.evidence.content).to.eql(second.dist.hash);
      expect(verified.evidence.assets).to.eql({ files: 1, totalBytes: 1, packageBytes: 0 });
      expect(verified.evidence.manifestChecksum).to.eql(second.manifestChecksum);
      expect('dist' in verified.evidence).to.eql(false);
    } finally {
      await Deno.remove(dir, { recursive: true });
    }
  });

  it('root prototype-sensitive selected names survive compute → JSON → load → strict verification', async () => {
    const dir = await directory();
    try {
      const files = [['__proto__', 'A'], ['constructor', 'BB'], ['toString', 'CCC']] as const;
      for (const [name, bytes] of files) await Deno.writeTextFile(`${dir}/${name}`, bytes);
      const build = await computed(dir);
      const expected = Object.fromEntries(files.map(([path, bytes]) => [
        path,
        `${Hash.sha256(bytes)}:size=${bytes.length}`,
      ]));
      expect(build.dist.hash.parts).to.eql(expected);
      expect(Obj.hasOwn(build.dist.hash.parts, '__proto__')).to.eql(true);
      const loaded = await Pkg.Dist.load(dir);
      expect(loaded.dist?.hash.parts).to.eql(expected);
      const verified = await Pkg.Dist.Pinned.verify({ dir, pin: build.pin, limits });
      if (verified.kind !== 'verified') throw new Error(`Expected verified: ${verified.kind}`);
      expect(verified.evidence.content.parts).to.eql(expected);
      expect(verified.evidence.assets.totalBytes).to.eql(6);
      await Deno.writeTextFile(`${dir}/__proto__`, 'B');
      expect(await Pkg.Dist.Pinned.verify({ dir, pin: build.pin, limits }))
        .to.eql({ kind: 'content-mismatch' });
      const changed = await computed(dir);
      expect(changed.pin.digest).not.to.eql(build.pin.digest);
      expect(await Pkg.Dist.Pinned.verify({ dir, pin: build.pin, limits }))
        .to.eql({ kind: 'pin-mismatch' });
    } finally {
      await Deno.remove(dir, { recursive: true });
    }
  });

  it('empty or unsafe candidates → no manifest and no pin', async () => {
    const dir = await directory();
    try {
      const empty = await Pkg.Dist.compute({ dir, save: true });
      expect(empty.kind).to.eql('failed');
      expect('pin' in empty).to.eql(false);
      expect('dist' in empty).to.eql(false);
      expect(await Fs.exists(`${dir}/dist.json`)).to.eql(false);
      await Deno.writeTextFile(`${dir}/a.txt`, 'A');
      const filtered = await Pkg.Dist.compute({ dir, save: true, filter: () => false });
      expect(filtered.kind).to.eql('failed');
      expect(await Fs.exists(`${dir}/dist.json`)).to.eql(false);
      await Deno.writeTextFile(`${dir}/bad:name`, 'bad');
      const invalid = await Pkg.Dist.compute({ dir, save: true });
      expect(invalid.kind).to.eql('failed');
      expect(await Fs.exists(`${dir}/dist.json`)).to.eql(false);
    } finally {
      await Deno.remove(dir, { recursive: true });
    }
  });

  it('valid inventory with a failed manifest save → no success fields', async () => {
    const dir = await directory();
    try {
      await Fs.write(`${dir}/a.txt`, 'A', { throw: true });
      await Fs.ensureDir(`${dir}/dist.json`);
      // The inventory is valid; only saving to the occupied directory must fail.
      const unsaved = await computed(dir, { save: false });
      expect(unsaved.dist.hash.parts).to.eql({ 'a.txt': `${Hash.sha256('A')}:size=1` });
      const result = await Pkg.Dist.compute({ dir, save: true });
      expect(result.kind).to.eql('failed');
      if (result.kind !== 'failed') throw new Error('Expected failed manifest save.');
      expect(result.error.message).to.eql('Dist computation failed.');
      expect(result.error.cause).not.to.eql(undefined);
      for (const key of ['dist', 'pin', 'manifestChecksum']) {
        expect(Obj.hasOwn(result, key)).to.eql(false);
      }
      expect(await Fs.Is.dir(`${dir}/dist.json`)).to.eql(true);
      expect((await Fs.readText(`${dir}/a.txt`)).data).to.eql('A');
    } finally {
      await Fs.remove(dir);
    }
  });

  it('child reuse preserves parent selection and exact sibling/space-sensitive spellings', async () => {
    const dir = await directory();
    try {
      for (const child of ['left', 'right']) {
        await Deno.mkdir(`${dir}/${child}`);
        await Deno.writeTextFile(`${dir}/${child}/ a.txt`, 'A');
        await Deno.writeTextFile(`${dir}/${child}/a.txt`, 'B');
        await Deno.writeTextFile(`${dir}/${child}/private.txt`, 'secret');
        await computed(`${dir}/${child}`);
      }
      const options = {
        ignore: ['**/private.txt'],
        filter: (path: string) => !path.endsWith('/right/a.txt'),
      };
      const direct = await computed(dir, options);
      const reused = await computed(dir, { ...options, trustChildDist: true });
      expect(reused.dist.hash).to.eql(direct.dist.hash);
      expect(Object.keys(reused.dist.hash.parts)).to.eql([
        'left/ a.txt',
        'left/a.txt',
        'right/ a.txt',
      ]);
      expect(reused.pin).to.eql(direct.pin);
      const child = await Fs.readJson<t.DistPkg>(`${dir}/left/dist.json`);
      if (!child.data) throw new Error('Expected child document.');
      const { scheme: _scheme, ...unsupported } = child.data.hash;
      await Deno.writeTextFile(
        `${dir}/left/dist.json`,
        Json.stringify({ ...child.data, hash: unsupported }),
      );
      const refused = await Pkg.Dist.compute({ dir, trustChildDist: true });
      expect(refused.kind).to.eql('failed');
      expect('pin' in refused).to.eql(false);
    } finally {
      await Deno.remove(dir, { recursive: true });
    }
  });

  it('child reuse → topmost inventories, one parent filter call, and progress only for fresh hashes', async () => {
    const dir = await directory();
    try {
      await Fs.write(`${dir}/root.txt`, 'root', { throw: true });
      await Fs.write(`${dir}/child/a.txt`, 'A', { throw: true });
      await Fs.write(`${dir}/child/private.txt`, 'secret', { throw: true });
      await Fs.write(`${dir}/child/nested/b.txt`, 'B', { throw: true });
      await computed(`${dir}/child/nested`);
      await computed(`${dir}/child`);
      // The topmost child already covers nested payloads; nested documents are not re-admitted.
      await Fs.write(`${dir}/child/nested/dist.json`, 'unsupported', { throw: true });
      const expected = ['child/a.txt', 'child/nested/b.txt', 'root.txt'];
      const pins: t.DistPin[] = [];
      for (const trustChildDist of [false, true]) {
        const filtered: string[] = [];
        const progress: t.Dir.Hash.Compute.ProgressEvent[] = [];
        const result = await computed(dir, {
          trustChildDist,
          ignore: ['**/private.txt'],
          filter(path) {
            filtered.push(path);
            return true;
          },
          onHashProgress(event) {
            progress.push(event);
          },
        });
        expect(filtered.sort()).to.eql(expected.map((path) => `${dir}/${path}`));
        expect(Object.keys(result.dist.hash.parts)).to.eql(expected);
        expect(progress.map((event) => event.path).sort()).to.eql(
          trustChildDist ? ['root.txt'] : expected,
        );
        expect(progress.every((event) => event.total === progress.length)).to.eql(true);
        pins.push(result.pin);
      }
      expect(pins[0]).to.eql(pins[1]);

      // Trusted reuse deliberately does not rehash changed child payloads.
      await Fs.write(`${dir}/child/a.txt`, 'changed', { throw: true });
      const reused = await computed(dir, { trustChildDist: true, ignore: ['**/private.txt'] });
      const direct = await computed(dir, { ignore: ['**/private.txt'] });
      expect(reused.pin).to.eql(pins[0]);
      expect(direct.pin).not.to.eql(reused.pin);
    } finally {
      await Fs.remove(dir);
    }
  });

  it('filter and progress failures → retained causes and no manifest publication', async () => {
    const dir = await directory();
    try {
      await Fs.write(`${dir}/a.txt`, 'A', { throw: true });
      const cause = new Error('caller callback failed');
      const fail = () => {
        throw cause;
      };
      for (const options of [{ filter: fail }, { onHashProgress: fail }]) {
        const result = await Pkg.Dist.compute({ dir, save: true, ...options });
        if (result.kind !== 'failed') throw new Error('Expected caller failure.');
        expect(result.error.message).to.eql('Dist computation failed.');
        expect(result.error.cause?.message).to.eql(cause.message);
        for (const key of ['dist', 'pin', 'manifestChecksum']) {
          expect(Obj.hasOwn(result, key)).to.eql(false);
        }
        expect(await Fs.exists(`${dir}/dist.json`)).to.eql(false);
      }
    } finally {
      await Fs.remove(dir);
    }
  });

  it('metadata-only replacement during verification → changed, not a fresh document baseline', async () => {
    const dir = await directory();
    try {
      await Deno.writeTextFile(`${dir}/a.txt`, 'A');
      const build = await computed(dir);
      let replaced = false;
      const result = await verifyPinnedWithIo({ dir, pin: build.pin, limits }, {
        ...DEFAULT_IO,
        async open(path) {
          if (path.endsWith('/a.txt') && !replaced) {
            replaced = true;
            await Deno.writeTextFile(
              `${dir}/dist.json`,
              Json.stringify({ ...build.dist, pkg: { name: 'changed', version: '2' } }),
            );
          }
          return await DEFAULT_IO.open(path);
        },
      });
      expect(replaced).to.eql(true);
      expect(result).to.eql({ kind: 'changed' });
      // A separate operation can legitimately admit the changed document under the same pin.
      expect((await Pkg.Dist.Pinned.verify({ dir, pin: build.pin, limits })).kind).to.eql(
        'verified',
      );
    } finally {
      await Deno.remove(dir, { recursive: true });
    }
  });

  it('mismatched content pin → no payload reads or tree traversal', async () => {
    const dir = await directory();
    try {
      await Deno.writeTextFile(`${dir}/a.txt`, 'A');
      await computed(dir);
      const opened: string[] = [];
      let traversals = 0;
      const result = await verifyPinnedWithIo({
        dir,
        pin: { scheme: 'sys.dist/v2', digest: `sha256-${'0'.repeat(64)}` },
        limits,
      }, {
        ...DEFAULT_IO,
        async open(path) {
          opened.push(path);
          return await DEFAULT_IO.open(path);
        },
        readDir(path) {
          traversals++;
          return DEFAULT_IO.readDir(path);
        },
      });
      expect(result).to.eql({ kind: 'pin-mismatch' });
      expect(opened).to.eql([`${dir}/dist.json`]);
      expect(traversals).to.eql(0);
    } finally {
      await Deno.remove(dir, { recursive: true });
    }
  });
});
