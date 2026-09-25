import { describe, expect, it } from '../../-test.ts';
import { Fs } from '../../m.Fs/mod.ts';
import { Pkg } from '../../m.Pkg/mod.ts';
import { verifyPinsWithIo } from '../m.Pins.ts';
import { DEFAULT_IO } from '../u.verify/u.io.ts';
import { fixture } from './-u.project.fixture.ts';

describe('Pkg.Dist.Pins.verify', () => {
  it('caller mutation during IO → verification uses the original pins, directories, and limits', async () => {
    await using f = await fixture();
    const projected = await Pkg.Dist.project(f.args);
    if (projected.kind !== 'projected') throw new Error('fixture projection failed');
    const selection = {
      pins: { a: { ...projected.pins.a }, z: { ...projected.pins.z } },
    };
    const args = {
      root: f.root,
      selection,
      dirs: { a: 'one', z: 'two' },
      limits: { ...f.args.limits },
      batch: { ...f.args.batch },
    };
    let first = true;
    const checked = await verifyPinsWithIo(args, {
      ...DEFAULT_IO,
      lstat(path) {
        if (first) {
          first = false;
          selection.pins.z['dist.json'] = 'changed';
          args.root = '/not-selected';
          args.dirs.z = 'source';
          args.limits.totalBytes = 0;
          args.batch.totalBytes = 0;
        }
        return DEFAULT_IO.lstat(path);
      },
    });
    expect(checked.kind).to.eql('verified');
    if (checked.kind === 'verified') {
      expect(Object.keys(checked.evidence)).to.eql(['a', 'z']);
      expect(checked.evidence.z.integrity).to.eql(projected.pins.z['dist.json']);
      expect(Object.isFrozen(checked.evidence)).to.eql(true);
    }
  });

  it('extra fields, mismatched directories, or too many distributions → failure before IO', async () => {
    await using f = await fixture();
    const pin = { 'dist.json': f.args.source.integrity };
    const args = {
      root: f.root,
      selection: { pins: { a: pin, z: pin } },
      dirs: { a: 'source', z: 'source' },
      limits: f.args.limits,
      batch: f.args.batch,
    };
    let reads = 0;
    const io = {
      ...DEFAULT_IO,
      lstat(path: string) {
        reads++;
        return DEFAULT_IO.lstat(path);
      },
    };
    for (
      const selection of [
        { ...args.selection, bindings: {} },
        { ...args.selection, extra: 'secret' },
      ]
    ) {
      expect(await verifyPinsWithIo({ ...args, selection }, io)).to.eql({ kind: 'invalid-input' });
    }
    for (const dirs of [{ ...args.dirs, extra: 'source' }, { a: 'source' }]) {
      expect(await verifyPinsWithIo<string>({ ...args, dirs }, io)).to.eql({
        kind: 'invalid-input',
      });
    }
    expect(await verifyPinsWithIo({ ...args, batch: { ...args.batch, inventories: 1 } }, io))
      .to.eql({ kind: 'limit-exceeded' });
    expect(reads).to.eql(0);
  });

  it('insufficient byte budget → second distribution fails before payload reads, with no evidence', async () => {
    await using f = await fixture();
    const projected = await Pkg.Dist.project(f.args);
    if (projected.kind !== 'projected') throw new Error('fixture projection failed');
    const args = {
      root: f.root,
      selection: { pins: projected.pins },
      dirs: { a: 'one', z: 'two' },
      limits: f.args.limits,
      batch: { inventories: 2, totalBytes: 8 },
    };
    const opened: string[] = [];
    const result = await verifyPinsWithIo(args, {
      ...DEFAULT_IO,
      open(path) {
        opened.push(path);
        return DEFAULT_IO.open(path);
      },
    });
    expect(result).to.eql({ kind: 'limit-exceeded', name: 'z' });
    expect(opened.includes(Fs.join(f.root, 'two/assets/data.bin'))).to.eql(false);
    const enough = await Pkg.Dist.Pins.verify({
      ...args,
      batch: { ...args.batch, totalBytes: 9 },
    });
    expect(enough.kind).to.eql('verified');
    await Fs.write(Fs.join(f.root, 'two/assets/data.bin'), 'changed', { throw: true });
    expect(await Pkg.Dist.Pins.verify({ ...args, batch: f.args.batch })).to.eql({
      kind: 'content-mismatch',
      name: 'z',
    });
  });
});
