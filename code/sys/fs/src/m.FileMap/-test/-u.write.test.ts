import { Sample } from '../-u.ts';
import { c, describe, expect, it, Str } from '../../-test.ts';
import { type t, Fs, Path } from '../common.ts';
import { FileMap } from '../mod.ts';

describe('FileMap.write', () => {
  const dir = Sample.source.dir;
  const makeMap = async () => FileMap.toMap(dir);

  const logOps = (title: string, ops: readonly t.FileMapOp[]) => {
    console.info(Str.SPACE);
    console.info(c.bold(c.cyan(title)), '\n');
    console.info(ops);
    console.info(Str.SPACE);
  };

  it('writes files to target (no --force)', async () => {
    const sample = await Sample.init();
    const bundle = await makeMap();
    const res = await FileMap.write(bundle, sample.target);
    expect(res.ops.every((o) => o.kind === 'create')).to.eql(true);
    expect(await sample.ls.target(true)).to.eql(res.ops.map((op) => op.path));

    logOps('operations | default write:', res.ops);
  });

  it('dryRun - nothing written', async () => {
    const sample = await Sample.init();
    const bundle = await makeMap();
    const res = await FileMap.write(bundle, sample.target, { dryRun: true });
    expect(res.ops.every((o) => o.kind === 'create')).to.eql(true);
    expect(res.ops.every((o) => o.dryRun === true)).to.eql(true);
    expect(await sample.ls.target(true)).to.eql([]);

    logOps('operations | dryRun:', res.ops);
  });

  it('skip existing when !force', async () => {
    const sample = await Sample.init();
    const bundle = await makeMap();

    await FileMap.write(bundle, sample.target);
    const res = await FileMap.write(bundle, sample.target);
    const ops = res.ops;

    const all = ops.every(({ kind }) => kind === 'skip' || kind === 'modify');
    expect(all).to.be.true;
    expect(res.ops.filter((o) => o.kind === 'create').length).to.eql(0);

    // Any skips should carry a path:
    const skipped = res.ops.find((o) => o.kind === 'skip');
    expect(!!skipped && typeof skipped.path === 'string' && skipped.path.length > 0).to.be.true;

    logOps('operations | skip existing (not forced):', res.ops);
  });

  it('force overwrite', async () => {
    const sample = await Sample.init();
    const bundle = await makeMap();

    const a = await FileMap.write(bundle, sample.target);
    const b = await FileMap.write(bundle, sample.target, { force: true });

    // Initial:
    expect(a.ops.some((o) => o.kind === 'create')).to.be.true;
    expect(a.ops.every((o) => o.forced === undefined)).to.be.true;

    // Forced modification:
    expect(b.ops.every((o) => o.kind === 'modify')).to.be.true; // ← All paths existed already; force should yield only modifies.
    expect(b.ops.every((o) => o.forced === true)).to.be.true; //   ← And every modify is marked as forced.

    logOps('operations | existing forced:', b.ops);
  });

  describe('processFile', () => {
    it('modify + rename + skip', async () => {
      const sample = await Sample.init();
      const bundle = await makeMap();

      // Choose a real text file from the bundle deterministically.
      const keys = Object.keys(bundle);
      const pickText =
        keys.find((k) => /(^|\/)readme\.md$/i.test(k)) ??
        keys.find((k) => k.endsWith('.md')) ??
        keys.find((k) => k.endsWith('.ts')) ??
        keys.find((k) => k.endsWith('.json'));
      expect(!!pickText, 'expected at least one text file in sample bundle').to.eql(true);
      const targetTextRel = pickText!;

      // Only try to rename .gitignore if it exists in the bundle:
      const hasGitignore = keys.includes('.gitignore');

      // Run the write operation:
      const fired: t.FileMapProcessorArgs[] = [];
      const res = await FileMap.write(bundle, sample.target, {
        processFile: async (e) => {
          fired.push(e);

          // Patch exactly the chosen text file:
          if (e.path === targetTextRel && e.text) e.modify(e.text + '\n<!-- patched -->\n');
          if (hasGitignore && e.path === '.gitignore') e.target.rename('.gitignore-renamed');

          // Exclude all non-SVG images:
          if (e.contentType.startsWith('image/') && e.contentType !== 'image/svg+xml') {
            e.skip('binary filtered');
          }

          const existed = await e.target.exists();
          expect(existed).to.eql(false);
        },
      });

      // Passes target filename to processor:
      expect(fired.every((e) => e.target.filename === Path.basename(e.target.relative))).to.be.true;

      // Rename emits canonical { from, to } - only if .gitignore existed:
      if (hasGitignore) {
        type R = t.FileMapOpOfKind<'create'> | t.FileMapOpOfKind<'modify'>;
        const renamed = res.ops.find(
          (o) => (o.kind === 'create' || o.kind === 'modify') && o.renamed?.from === '.gitignore',
        ) as R;

        expect(!!renamed).to.eql(true);
        if (renamed) {
          expect(renamed.renamed?.from).to.eql('.gitignore');
          expect(renamed.path).to.eql('.gitignore-renamed');
          expect(await Fs.exists(Path.join(sample.target, '.gitignore-renamed'))).to.eql(true);
        }
      }

      // A skip op exists and carries a path (image filtered):
      const skipped = res.ops.find((o) => o.kind === 'skip')!;
      expect(!!skipped && typeof skipped.path === 'string' && skipped.path.length > 0).to.be.true;
      expect(skipped.reason).to.eql('binary filtered');

      // Verify the patched content on disk for the actual file chosen:
      const textAbs = Path.join(sample.target, targetTextRel);
      const textRead = await Fs.readText(textAbs);
      expect(textRead.exists).to.eql(true);
      expect(textRead.data?.includes('<!-- patched -->')).to.eql(true);

      // Sanity:
      expect((res.total.modify ?? 0) >= 1 || (res.total.create ?? 0) >= 1).to.eql(true);
      expect((res.total.skip ?? 0) >= 1).to.eql(true);

      logOps('operations | processFile:', res.ops);
    });

    describe('modify on first write → write', () => {});
  });

  it('binary pass-through', async () => {
    const sample = await Sample.init();
    const bundle = await makeMap();
    const res = await FileMap.write(bundle, sample.target, {
      processFile(e) {
        // Images are binary except SVG (structured text):
        if (e.contentType.startsWith('image/') && e.contentType !== 'image/svg+xml') {
          expect(!!e.bytes && !e.text).to.be.true;
        }
      },
    });
    expect(res.ops.every((op) => op.forced === undefined)).to.be.true;

    logOps('operations | binary pass-through:', res.ops);
  });

  it('modify on first write → create', async () => {
    const sample = await Sample.init();
    const bundle = await FileMap.toMap(Sample.source.dir);

    // Pick a text file deterministically:
    const keys = Object.keys(bundle);
    const pickText =
      keys.find((k) => /(^|\/)readme\.md$/i.test(k)) ??
      keys.find((k) => k.endsWith('.md')) ??
      keys.find((k) => k.endsWith('.ts')) ??
      keys.find((k) => k.endsWith('.json'))!;
    const rel = pickText;

    const res = await FileMap.write(bundle, sample.target, {
      processFile(e) {
        if (e.path === rel && e.text) e.modify(e.text + '\n// patched\n');
      },
    });

    const op = res.ops.find((o) => o.path === rel)!;
    expect(op?.kind).to.eql('create'); // ← still a create on first write

    const abs = Path.join(sample.target, rel);
    const text = await Fs.readText(abs);
    expect(text.exists).to.eql(true);
    expect(text.data?.includes('// patched')).to.eql(true);
  });

  it('rename on first write → create + renamed', async () => {
    const sample = await Sample.init();
    const bundle = await FileMap.toMap(Sample.source.dir);

    const keys = Object.keys(bundle);
    const pick =
      keys.find((k) => k === '.gitignore') ??
      keys.find((k) => /(^|\/)readme\.md$/i.test(k)) ??
      keys.find((k) => k.endsWith('.md'))!;
    const from = pick;
    const to = from.replace(/(\.\w+)?$/, (m) => `-renamed${m || ''}`);

    const res = await FileMap.write(bundle, sample.target, {
      processFile(e) {
        if (e.path === from) e.target.rename(to);
      },
    });

    const op = res.ops.find((o) => o.path === to)!;
    expect(op?.kind).to.eql('create');
    expect((op as t.FileMapOpOfKind<'create'>).renamed?.from).to.eql(from);
    expect(await Fs.exists(Path.join(sample.target, to))).to.eql(true);
  });

  it('rename onto existing + modify → modify + renamed', async () => {
    const sample = await Sample.init();
    const bundle = await FileMap.toMap(Sample.source.dir);

    // First write: create everything.
    await FileMap.write(bundle, sample.target);

    // Choose two distinct text files: A will be renamed onto B.
    const keys = Object.keys(bundle).filter(
      (k) => k.endsWith('.md') || k.endsWith('.ts') || k.endsWith('.json'),
    );
    expect(keys.length >= 2).to.eql(true);
    const [from, to] = [keys[0], keys.find((k) => k !== keys[0])!];

    const res = await FileMap.write(bundle, sample.target, {
      processFile(e) {
        if (e.path === from) {
          e.target.rename(to); // path topology change
          if (e.text) e.modify(e.text + '\n// rename+patch\n'); // content change
        }
        // leave 'to' as-is; we are writing onto it via rename(from → to)
      },
    });

    const op = res.ops.find((o) => o.path === to)!;
    expect(op?.kind).to.eql('modify'); // existing destination changed
    expect((op as t.FileMapOpOfKind<'modify'>).renamed?.from).to.eql(from); // rename facet preserved
    const dest = await Fs.readText(Path.join(sample.target, to));
    expect(dest.data?.includes('// rename+patch')).to.eql(true);
  });

  it('skip overrides rename/modify (no renamed on skip)', async () => {
    const sample = await Sample.init();
    const bundle = await FileMap.toMap(Sample.source.dir);

    const anyKey = Object.keys(bundle)[0]!;
    const res = await FileMap.write(bundle, sample.target, {
      processFile(e) {
        if (e.path === anyKey) {
          e.target.rename(anyKey + '.ignored');
          if (e.text) e.modify(e.text + '\n// would-change\n');
          e.skip('filtered'); // ← wins
        }
      },
    });

    const op =
      res.ops.find((o) => o.path === anyKey + '.ignored') ??
      res.ops.find((o) => o.path === anyKey)!;
    expect(op.kind).to.eql('skip');
    expect((op as t.FileMapOpOfKind<'skip'>).reason).to.eql('filtered');
    expect((op as any).renamed).to.eql(undefined);
  });

  it('unchanged second write → skip (unchanged)', async () => {
    const sample = await Sample.init();
    const bundle = await FileMap.toMap(Sample.source.dir);

    await FileMap.write(bundle, sample.target); // create
    const res = await FileMap.write(bundle, sample.target); // unchanged

    // all should be skip, and at least one should report reason: 'unchanged'
    expect(res.ops.every((o) => o.kind === 'skip' || o.kind === 'modify')).to.be.true;
    expect(res.ops.some((o) => o.kind === 'skip' && o.reason === 'unchanged')).to.be.true;
  });

  describe('errors', () => {
    it('throws when map contains a non-string value', async () => {
      // Invalid map: value must be string (data-URI), not number.
      const badMap = { 'a.txt': 123 } as unknown as t.FileMap;
      const tmp = await Fs.makeTempDir({ prefix: 'filemap-invalid-' });
      let threw = false;

      try {
        await FileMap.write(badMap, tmp.absolute as t.StringDir);
      } catch (err: any) {
        threw = true;
        expect(String(err?.message ?? err)).to.include('Invalid FileMap');
      }

      expect(threw).to.eql(true);
    });
  });
});
