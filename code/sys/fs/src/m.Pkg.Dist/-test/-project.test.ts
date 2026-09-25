import { describe, expect, it } from '../../-test.ts';
import { Fs } from '../../m.Fs/mod.ts';
import { Pkg } from '../../m.Pkg/mod.ts';
import { DEFAULT_IO as ROOTED_IO } from '../../m.Fs.capability/m.Rooted/u/u.io.ts';
import { DEFAULT_IO } from '../u.verify/u.io.ts';
import { projectWithIo } from '../u/u.project.ts';
import { binary, fixture } from './-u.project.fixture.ts';

describe('Pkg.Dist.project', () => {
  it('copies the selected files unchanged and returns frozen manifest pins', async () => {
    await using f = await fixture();
    const result = await Pkg.Dist.project(f.args);
    expect(result.kind).to.eql('projected');
    if (result.kind !== 'projected') return;
    expect(Object.keys(result.pins)).to.eql(['a', 'z']);
    expect(Object.isFrozen(result.pins.a)).to.eql(true);
    expect(Object.isFrozen(result)).to.eql(true);
    expect((await Fs.read(Fs.join(f.root, 'two/assets/data.bin'))).data).to.eql(binary);
    for (const name of ['a', 'z'] as const) {
      const checked = await Pkg.Dist.Pinned.verify({
        dir: Fs.join(f.root, f.args.outputs[name]),
        integrity: result.pins[name]['dist.json'],
        limits: f.args.limits,
      });
      expect(checked.kind).to.eql('verified');
      if (checked.kind === 'verified') {
        expect(Object.keys(checked.evidence.dist.hash.parts)).to.eql(
          name === 'a' ? ['index.html'] : ['assets/data.bin'],
        );
      }
    }
  });

  it('caller mutation → projection uses the original inputs and selected paths', async () => {
    await using f = await fixture();
    const selected = { a: ['index.html'], z: ['assets/data.bin'] };
    const pkg = { name: '@test/original', version: '1.0.0' };
    f.args.pkg = pkg;
    f.args.select = (dist) => {
      expect(Object.isFrozen(dist.hash.parts)).to.eql(true);
      return selected;
    };
    let first = true;
    const result = await projectWithIo(f.args, {
      ...DEFAULT_IO,
      lstat(path) {
        if (first) {
          first = false;
          f.args.root = '/not-selected';
          f.args.source.dir = 'not-selected';
          f.args.source.integrity = 'changed';
          f.args.outputs.a = 'not-selected';
          f.args.limits.totalBytes = 0;
          f.args.batch.totalBytes = 0;
          f.args.select = () => {
            throw new Error('not selected');
          };
          pkg.name = '@test/changed';
        }
        return DEFAULT_IO.lstat(path);
      },
    }, {
      ...ROOTED_IO,
      mkdir(path, options) {
        selected.z[0] = 'spare.txt';
        return ROOTED_IO.mkdir(path, options);
      },
    });
    expect(result.kind).to.eql('projected');
    const loaded = await Pkg.Dist.load(Fs.join(f.root, 'one'));
    expect(loaded.dist?.pkg).to.eql({ name: '@test/original', version: '1.0.0' });
    expect((await Fs.read(Fs.join(f.root, 'two/assets/data.bin'))).data).to.eql(binary);
  });

  it('source changes after promotion → failure without pins; completed outputs remain', async () => {
    await using f = await fixture();
    const result = await projectWithIo(f.args, DEFAULT_IO, {
      ...ROOTED_IO,
      async rename(from, to) {
        await ROOTED_IO.rename(from, to);
        await Fs.write(Fs.join(f.source, 'spare.txt'), 'changed', { throw: true });
      },
    });
    expect(result).to.eql({
      kind: 'failed',
      phase: 'recheck',
      reason: 'content-mismatch',
      remaining: ['a', 'z'],
    });
    expect(await Fs.exists(Fs.join(f.root, 'one/index.html'))).to.eql(true);
  });

  it('checks output count before IO and combined copy size before staging', async () => {
    await using f = await fixture();
    let reads = 0;
    let writes = 0;
    const io = {
      ...DEFAULT_IO,
      lstat(path: string) {
        reads++;
        return DEFAULT_IO.lstat(path);
      },
    };
    const rooted = {
      ...ROOTED_IO,
      mkdir(path: string, options?: Deno.MkdirOptions) {
        writes++;
        return ROOTED_IO.mkdir(path, options);
      },
    };
    f.args.batch.inventories = 1;
    expect(await projectWithIo(f.args, io, rooted)).to.eql({
      kind: 'failed',
      phase: 'input',
      reason: 'limit-exceeded',
      remaining: [],
    });
    expect(reads).to.eql(0);
    f.args.batch = { inventories: 2, totalBytes: 9 };
    f.args.select = () => ({ a: ['index.html'], z: ['index.html'] });
    expect(await projectWithIo(f.args, io, rooted)).to.eql({
      kind: 'failed',
      phase: 'select',
      reason: 'limit-exceeded',
      remaining: [],
    });
    expect(writes).to.eql(0);
    f.args.batch.totalBytes = 10;
    expect((await Pkg.Dist.project(f.args)).kind).to.eql('projected');
  });

  it('unsafe, overlapping, and occupied destinations → no target changes', async () => {
    for (const output of ['../escape', 'source/nested', 'one/nested']) {
      await using f = await fixture();
      f.args.outputs.z = output;
      const result = await Pkg.Dist.project(f.args);
      expect(result.kind).to.eql('failed');
      expect(await Fs.exists(Fs.join(f.root, 'one'))).to.eql(false);
      expect(await Fs.exists(Fs.join(f.root, '.sys.rooted'))).to.eql(false);
    }
    await using f = await fixture();
    await Fs.write(Fs.join(f.root, 'two/keep.txt'), 'untouched', { throw: true });
    expect(await Pkg.Dist.project(f.args)).to.eql({
      kind: 'failed',
      phase: 'output',
      output: 'z',
      reason: 'occupied',
      remaining: [],
    });
    expect((await Fs.readText(Fs.join(f.root, 'two/keep.txt'))).data).to.eql('untouched');
    expect(await Fs.exists(Fs.join(f.root, 'one'))).to.eql(false);
  });

  for (const canonical of [true, false]) {
    it(`source alias with ${canonical ? 'canonical' : 'preserved'} spelling → no staging or source changes`, async () => {
      await using f = await fixture();
      const alias = Fs.join(f.root, 'source-alias');
      const actual = (path: string) =>
        path === alias || path.startsWith(`${alias}/`)
          ? `${f.source}${path.slice(alias.length)}`
          : path;
      f.args.source.dir = 'source-alias';
      f.args.outputs.a = 'source/assets/subset';
      let writes = 0;
      const result = await projectWithIo(f.args, {
        ...DEFAULT_IO,
        lstat: (path) => DEFAULT_IO.lstat(actual(path)),
        realPath: (path) =>
          path === alias && !canonical ? Promise.resolve(alias) : DEFAULT_IO.realPath(actual(path)),
        readDir: (path) => DEFAULT_IO.readDir(actual(path)),
        open: (path) => DEFAULT_IO.open(actual(path)),
      }, {
        ...ROOTED_IO,
        mkdir(path, options) {
          writes++;
          return ROOTED_IO.mkdir(path, options);
        },
      });
      expect(result).to.eql({
        kind: 'failed',
        phase: 'output',
        output: 'a',
        reason: 'unsafe-path',
        remaining: [],
      });
      expect(writes).to.eql(0);
      expect(await Fs.exists(Fs.join(f.source, 'assets/subset'))).to.eql(false);
      expect(
        (await Pkg.Dist.Pinned.verify({
          dir: f.source,
          integrity: f.args.source.integrity,
          limits: f.args.limits,
        })).kind,
      ).to.eql('verified');
    });
  }

  it('empty output selection → refusal before staging or promotion', async () => {
    await using f = await fixture();
    f.args.select = () => ({ a: ['index.html'], z: [] });
    let writes = 0;
    const result = await projectWithIo(f.args, DEFAULT_IO, {
      ...ROOTED_IO,
      mkdir(path, options) {
        writes++;
        return ROOTED_IO.mkdir(path, options);
      },
    });
    expect(result).to.eql({
      kind: 'failed',
      phase: 'select',
      reason: 'invalid-input',
      remaining: [],
    });
    expect(writes).to.eql(0);
    expect(await Fs.exists(Fs.join(f.root, 'one'))).to.eql(false);
    expect(await Fs.exists(Fs.join(f.root, 'two'))).to.eql(false);
  });

  it('untrusted stage container → possible residue remains reported without a stage handle', async () => {
    await using f = await fixture();
    const token = 'untrusted-container';
    const container = Fs.join(f.root, '.sys.rooted/stages', token);
    let removals = 0;
    const result = await projectWithIo(f.args, DEFAULT_IO, {
      ...ROOTED_IO,
      token: () => token,
      async lstat(path) {
        const info = await ROOTED_IO.lstat(path);
        return path === container ? { ...info, dev: -1 } : info;
      },
      remove(path, options) {
        removals++;
        return ROOTED_IO.remove(path, options);
      },
    });
    expect(result).to.eql({
      kind: 'failed',
      phase: 'output',
      output: 'a',
      reason: 'unsupported',
      remaining: ['a'],
    });
    expect(removals).to.eql(0);
    expect(await Fs.exists(container)).to.eql(true);
    expect(await Fs.exists(Fs.join(f.root, 'one'))).to.eql(false);
  });

  it('file publication and temporary cleanup fail → retain both failures after stage discard', async () => {
    await using f = await fixture();
    let removals = 0;
    const result = await projectWithIo(f.args, DEFAULT_IO, {
      ...ROOTED_IO,
      link() {
        throw new Deno.errors.NotSupported('publication');
      },
      remove(path, options) {
        if (Fs.basename(path).startsWith('.sys.rooted-tmp-') && removals++ === 0) {
          throw new Error('temporary cleanup');
        }
        return ROOTED_IO.remove(path, options);
      },
    });
    expect(result).to.eql({
      kind: 'failed',
      phase: 'output',
      output: 'a',
      reason: 'unsupported',
      remaining: [],
      cleanup: 'io-failure',
    });
    expect(removals).to.eql(2);
    const stages: string[] = [];
    for await (const entry of Deno.readDir(Fs.join(f.root, '.sys.rooted/stages'))) {
      stages.push(entry.name);
    }
    expect(stages).to.eql([]);
    expect(await Fs.exists(Fs.join(f.root, 'one'))).to.eql(false);
    expect(await Fs.exists(Fs.join(f.root, 'two'))).to.eql(false);
  });

  it('invalid selection or policy error → no staging; policy error details stay private', async () => {
    await using f = await fixture();
    for (const paths of [['dist.json'], ['../escape'], ['missing'], ['index.html', 'index.html']]) {
      f.args.select = () => ({ a: paths, z: ['assets/data.bin'] });
      expect(await Pkg.Dist.project(f.args)).to.eql({
        kind: 'failed',
        phase: 'select',
        reason: 'invalid-input',
        remaining: [],
      });
    }
    f.args.select = () => {
      throw new Error('private policy detail');
    };
    expect(await Pkg.Dist.project(f.args)).to.eql({
      kind: 'failed',
      phase: 'select',
      reason: 'policy-failure',
      remaining: [],
    });
    expect(await Fs.exists(Fs.join(f.root, '.sys.rooted'))).to.eql(false);
  });

  it('cancellation → stage removed and no pins returned', async () => {
    await using f = await fixture();
    const before = new AbortController();
    before.abort();
    expect(await Pkg.Dist.project({ ...f.args, until: before.signal })).to.eql({
      kind: 'failed',
      phase: 'input',
      reason: 'cancelled',
      remaining: [],
    });
    const during = new AbortController();
    const result = await projectWithIo({ ...f.args, until: during.signal }, DEFAULT_IO, {
      ...ROOTED_IO,
      async link(from, to) {
        await ROOTED_IO.link(from, to);
        during.abort();
      },
    });
    expect(result).to.eql({
      kind: 'failed',
      phase: 'output',
      output: 'a',
      reason: 'cancelled',
      remaining: [],
    });
    expect(await Fs.exists(Fs.join(f.root, 'one'))).to.eql(false);
  });

  it('second output and cleanup fail → first output remains, no pins returned', async () => {
    await using f = await fixture();
    let failed = false;
    const result = await projectWithIo(f.args, DEFAULT_IO, {
      ...ROOTED_IO,
      rename(from, to) {
        if (to === Fs.join(f.root, 'two')) {
          failed = true;
          throw new Deno.errors.NotSupported('primary secret');
        }
        return ROOTED_IO.rename(from, to);
      },
      remove(path, options) {
        if (failed) throw new Error('cleanup secret');
        return ROOTED_IO.remove(path, options);
      },
    });
    expect(result).to.eql({
      kind: 'failed',
      phase: 'output',
      output: 'z',
      reason: 'unsupported',
      remaining: ['a', 'z'],
      cleanup: 'io-failure',
    });
    expect(Object.isFrozen(result)).to.eql(true);
    expect(await Fs.exists(Fs.join(f.root, 'one/index.html'))).to.eql(true);
    expect(await Fs.exists(Fs.join(f.root, 'two'))).to.eql(false);
  });

  it('promotion cleanup-only error → failure even though the final output exists', async () => {
    await using f = await fixture();
    let promoted = false;
    const result = await projectWithIo(f.args, DEFAULT_IO, {
      ...ROOTED_IO,
      async rename(from, to) {
        await ROOTED_IO.rename(from, to);
        promoted = true;
      },
      remove(path, options) {
        if (promoted) throw new Error('cleanup');
        return ROOTED_IO.remove(path, options);
      },
    });
    expect(result).to.eql({
      kind: 'failed',
      phase: 'cleanup',
      output: 'a',
      reason: 'io-failure',
      remaining: ['a'],
      cleanup: 'io-failure',
    });
    expect(await Fs.exists(Fs.join(f.root, 'one/index.html'))).to.eql(true);
    expect(await Fs.exists(Fs.join(f.root, 'two'))).to.eql(false);
  });
});

Deno.test('Pkg.Dist.project: host filesystem aliases', async (t) => {
  for (const [name, alias] of [['source', 'Source'], ['caf\u00e9', 'cafe\u0301']]) {
    await using f = await fixture(name);
    const original = await Deno.lstat(f.source);
    const aliased = await Fs.lstat(Fs.join(f.root, alias));
    const supported = aliased?.dev === original.dev && aliased?.ino === original.ino;
    await t.step({
      name: `${name} / ${alias} → reject overlap without changing the source`,
      ignore: !supported,
      async fn() {
        for (const aliasSource of [true, false]) {
          f.args.source.dir = aliasSource ? alias : name;
          f.args.outputs.a = `${aliasSource ? name : alias}/assets/subset`;
          let writes = 0;
          const result = await projectWithIo(f.args, DEFAULT_IO, {
            ...ROOTED_IO,
            mkdir(path, options) {
              writes++;
              return ROOTED_IO.mkdir(path, options);
            },
          });
          expect(result).to.eql({
            kind: 'failed',
            phase: 'output',
            output: 'a',
            reason: 'unsafe-path',
            remaining: [],
          });
          expect(writes).to.eql(0);
          expect(await Fs.exists(Fs.join(f.source, 'assets/subset'))).to.eql(false);
          expect(
            (await Pkg.Dist.Pinned.verify({
              dir: f.source,
              integrity: f.args.source.integrity,
              limits: f.args.limits,
            })).kind,
          ).to.eql('verified');
        }
      },
    });
  }
});
