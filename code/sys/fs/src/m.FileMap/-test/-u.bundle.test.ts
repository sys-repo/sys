import { Sample } from './-u.ts';
import { describe, it, expect } from '../../-test.ts';

import { type t, Fs, Path } from '../common.ts';
import { FileMap } from '../mod.ts';

describe('FileMap.bundle (rollup: toMap + write)', () => {
  const dir = Sample.source.dir as t.StringDir;

  it('writes artifact and returns absolute path + count', async () => {
    const tmp = await Sample.init('FileMap.bundle.basic.');
    const outFile = Path.join(tmp.target, 'bundle.json') as t.StringPath;

    const res = await FileMap.bundle(dir, { targetFile: outFile });

    // Path is absolute and matches resolved outFile:
    expect(res.file).to.eql(Path.resolve(outFile));

    // Count matches number of keys:
    expect(res.count).to.eql(Object.keys(res.fileMap).length);

    // Artifact exists on disk and round-trips keys:
    expect(await Fs.exists(outFile)).to.eql(true);
    const json = (await Fs.readText(outFile)).data ?? '';
    const roundTripped = JSON.parse(json) as t.FileMap;
    expect(Object.keys(roundTripped)).to.eql(Object.keys(res.fileMap));
  });

  it('accepts targetFile as a plain string and writes the artifact', async () => {
    const tmp = await Sample.init('FileMap.bundle.overload.');
    const outFile = Path.join(tmp.target, 'bundle.json') as t.StringPath;

    // Call overload: second arg is a string, not an options object:
    const res = await FileMap.bundle(dir, outFile);

    expect(res.file).to.eql(Path.resolve(outFile));
    expect(await Fs.exists(outFile)).to.eql(true);
    expect(res.count).to.eql(Object.keys(res.fileMap).length);

    // Round-trip: JSON on disk exactly matches in-memory map keys.
    const json = (await Fs.readText(outFile)).data ?? '';
    const roundTripped = JSON.parse(json) as t.FileMap;
    expect(Object.keys(roundTripped)).to.eql(Object.keys(res.fileMap));
  });

  it('passes through filter: only .ts and .json are included', async () => {
    const tmp = await Sample.init('FileMap.bundle.filter.');
    const outFile = Path.join(tmp.target, 'bundle.json') as t.StringPath;

    const res = await FileMap.bundle(dir, {
      targetFile: outFile,
      filter: (e) => e.ext === '.ts' || e.ext === '.json',
    });

    const keys = Object.keys(res.fileMap);
    expect(keys.length > 0).to.eql(true);
    expect(keys.every((k) => k.endsWith('.ts') || k.endsWith('.json'))).to.eql(true);

    // Verify the artifact matches the filtered keys:
    const json = (await Fs.readText(outFile)).data ?? '';
    const m = JSON.parse(json) as t.FileMap;
    expect(Object.keys(m)).to.eql(keys);
  });

  it('creates parent directories for targetFile (deep path)', async () => {
    const tmp = await Sample.init('FileMap.bundle.mkdirs.');
    const deepDir = Path.join(tmp.target, 'a/b/c');
    const outFile = Path.join(deepDir, 'bundle.json') as t.StringPath;

    const res = await FileMap.bundle(dir, { targetFile: outFile });

    // Deep artifact exists:
    expect(await Fs.exists(outFile)).to.eql(true);

    // Sanity check: returned absolute path is correct:
    expect(res.file).to.eql(Path.resolve(outFile));
  });

  it('empty bundle when filter excludes all', async () => {
    const tmp = await Sample.init('FileMap.bundle.empty.');
    const outFile = Path.join(tmp.target, 'bundle.json') as t.StringPath;

    const res = await FileMap.bundle(dir, {
      targetFile: outFile,
      filter: () => false,
    });

    expect(res.count).to.eql(0);
    expect(Object.keys(res.fileMap)).to.eql([]);

    const json = (await Fs.readText(outFile)).data ?? '';
    const m = JSON.parse(json) as t.FileMap;
    expect(Object.keys(m)).to.eql([]);
  });

  it('accepts relative targetFile and returns absolute path', async () => {
    const tmp = await Sample.init('FileMap.bundle.rel.');
    const rel = Path.relative('.', Path.join(tmp.target, 'bundle.json')) as t.StringPath;

    const res = await FileMap.bundle(dir, { targetFile: rel });

    expect(await Fs.exists(res.file)).to.eql(true);
    expect(Path.Is.absolute(res.file)).to.eql(true);
    expect(res.file).to.eql(Path.resolve(rel));
  });

  it('throws when parent dir is unwritable (simulated)', async () => {
    const unwritable = '/root/__nope__/bundle.json'; // NB: illegal write target (system directory on posix).
    let threw = false;
    try {
      await FileMap.bundle(dir, { targetFile: unwritable });
    } catch {
      threw = true;
    }
    expect(threw).to.eql(true);
  });
});
