import { Sample } from '../-u.ts';
import { c, describe, expect, it, Str } from '../../-test.ts';

import { type t, Fs, Path } from '../common.ts';
import { FileMap } from '../mod.ts';

describe('materialize', () => {
  const dir = Sample.source.dir;
  const makeMap = async () => FileMap.toMap(dir);

  const logOps = (title: string, ops: readonly t.FileMapMaterializeOp[]) => {
    console.info(Str.SPACE);
    console.info(c.bold(c.cyan(title)), '\n');
    console.info(ops);
    console.info(Str.SPACE);
  };

  const opPaths = (ops: readonly t.FileMapMaterializeOp[]) => {
    return ops.map((op) => (op.kind === 'rename' ? op.to : op.path) ?? '');
  };

  it('writes files to target (no --force)', async () => {
    const sample = await Sample.init();
    const bundle = await makeMap();
    const res = await FileMap.materialize(bundle, sample.target);
    expect(res.ops.every((o) => o.kind === 'write')).to.eql(true);
    expect(await sample.ls.target(true)).to.eql(opPaths(res.ops));

    logOps('operations | default write:', res.ops);
  });

  it('dryRun - nothing written', async () => {
    const sample = await Sample.init();
    const bundle = await makeMap();
    const res = await FileMap.materialize(bundle, sample.target, { dryRun: true });
    expect(res.ops.every((o) => o.kind === 'write')).to.eql(true);
    expect(res.ops.every((o) => o.dryRun === true)).to.eql(true);
    expect(await sample.ls.target(true)).to.eql([]);

    logOps('operations | dryRun:', res.ops);
  });

  it('skip existing when !force', async () => {
    const sample = await Sample.init();
    const bundle = await makeMap();

    await FileMap.materialize(bundle, sample.target);
    const res = await FileMap.materialize(bundle, sample.target);
    const ops = res.ops;

    const all = ops.every(({ kind }) => kind === 'skip' || kind === 'rename' || kind === 'modify');
    expect(all).to.be.true;
    expect(res.ops.filter((o) => o.kind === 'write').length).to.eql(0);

    // Any skips should carry a path:
    const skipped = res.ops.find((o) => o.kind === 'skip');
    expect(!!skipped && typeof skipped.path === 'string' && skipped.path.length > 0).to.be.true;

    logOps('operations | skip existing (not forced):', res.ops);
  });

  it('force overwrite', async () => {
    const sample = await Sample.init();
    const bundle = await makeMap();

    await FileMap.materialize(bundle, sample.target);
    const res = await FileMap.materialize(bundle, sample.target, { force: true });
    expect(res.ops.some((o) => o.kind === 'write')).to.eql(true);
    expect(res.ops.every((o) => o.forced)).to.eql(true);

    logOps('operations | existing forced:', res.ops);
  });

  it('processFile: modify + rename + exclude', async () => {
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

    // Only try to rename .gitignore if it exists in the bundle
    const hasGitignore = keys.includes('.gitignore');

    const res = await FileMap.materialize(bundle, sample.target, {
      processFile: async (e: t.FileMapProcessEvent) => {
        // Patch exactly the chosen text file:
        if (e.path === targetTextRel && e.text) e.modify(e.text + '\n<!-- patched -->\n');
        if (hasGitignore && e.path === '.gitignore') e.target.rename('.gitignore-renamed');

        // Exclude all non-SVG images:
        if (e.contentType.startsWith('image/') && e.contentType !== 'image/svg+xml') {
          e.exclude('binary filtered');
        }

        const existed = await e.target.exists();
        expect(existed).to.eql(false);
      },
    });

    const ops = res.ops.reduce<Record<string, number>>((acc, o) => {
      acc[o.kind] = (acc[o.kind] ?? 0) + 1;
      return acc;
    }, {});

    // Rename emits canonical { from, to } (only if .gitignore existed):
    if (hasGitignore) {
      const rename = res.ops.find((o) => o.kind === 'rename');
      expect(!!rename).to.eql(true);
      if (rename) {
        expect(rename.from).to.eql('.gitignore');
        expect(rename.to).to.eql('.gitignore-renamed');
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
    expect((ops.modify ?? 0) >= 1 || (ops.write ?? 0) >= 1).to.eql(true);
    expect((ops.skip ?? 0) >= 1).to.eql(true);

    logOps('operations | processFile:', res.ops);
  });

  it('binary pass-through', async () => {
    const sample = await Sample.init();
    const bundle = await makeMap();
    const res = await FileMap.materialize(bundle, sample.target, {
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

  it('throws when map contains a non-string value', async () => {
    // Invalid map: value must be string (data-URI), not number.
    const badMap = { 'a.txt': 123 } as unknown as t.FileMap;
    const tmp = await Fs.makeTempDir({ prefix: 'filemap-materialize-invalid-' });
    let threw = false;

    try {
      await FileMap.materialize(badMap, tmp.absolute as t.StringDir);
    } catch (err: any) {
      threw = true;
      expect(String(err?.message ?? err)).to.include('Invalid FileMap');
    }

    expect(threw).to.eql(true);
  });
});
