import { Sample } from '../-u.ts';
import { describe, expect, it } from '../../-test.ts';

import { type t, Fs, Path } from '../common.ts';
import { FileMap } from '../mod.ts';

describe('materialize', () => {
  const dir = Sample.source.dir;
  const makeMap = async () => FileMap.toMap(dir);

  it('writes files to target (no force)', async () => {
    const sample = Sample.init();
    const bundle = await makeMap();
    const res = await FileMap.materialize(bundle, sample.target);
    expect(res.ops.some((o) => o.kind === 'write')).to.eql(true);
  });

  it('skip existing when !force', async () => {
    const sample = Sample.init();
    const bundle = await makeMap();

    await FileMap.materialize(bundle, sample.target);
    const res = await FileMap.materialize(bundle, sample.target);
    const ops = res.ops;

    const all = ops.every(({ kind }) => kind === 'skip' || kind === 'rename' || kind === 'modify');
    expect(all).to.be.true;
    expect(res.ops.filter((o) => o.kind === 'write').length).to.eql(0);

    // Any skips should carry a path:
    const someSkip = res.ops.find((o) => o.kind === 'skip');
    expect(!!someSkip && typeof someSkip.path === 'string' && someSkip.path.length > 0).to.eql(
      true,
    );
  });

  it('force overwrite', async () => {
    const sample = Sample.init();
    const bundle = await makeMap();

    await FileMap.materialize(bundle, sample.target);
    const res = await FileMap.materialize(bundle, sample.target, { force: true });
    expect(res.ops.some((o) => o.kind === 'write')).to.eql(true);
  });

  it('processFile: modify + rename + exclude', async () => {
    const sample = Sample.init();
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
    const someSkip = res.ops.find((o) => o.kind === 'skip');
    expect(!!someSkip && typeof someSkip.path === 'string' && someSkip.path.length > 0).to.eql(
      true,
    );

    // Verify the patched content on disk for the actual file chosen:
    const textAbs = Path.join(sample.target, targetTextRel);
    const textRead = await Fs.readText(textAbs);
    expect(textRead.exists).to.eql(true);
    expect(textRead.data?.includes('<!-- patched -->')).to.eql(true);

    // Sanity:
    expect((ops.modify ?? 0) >= 1 || (ops.write ?? 0) >= 1).to.eql(true);
    expect((ops.skip ?? 0) >= 1).to.eql(true);
  });

  it('binary passthrough', async () => {
    const sample = Sample.init();
    const bundle = await makeMap();
    await FileMap.materialize(bundle, sample.target, {
      processFile(e) {
        // Images are binary except SVG (structured text):
        if (e.contentType.startsWith('image/') && e.contentType !== 'image/svg+xml') {
          expect(!!e.bytes && !e.text).to.be.true;
        }
      },
    });
  });
});
