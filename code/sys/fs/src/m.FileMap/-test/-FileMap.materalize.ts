import { describe, expect, it } from '../../-test.ts';

import { Sample } from '../-u.ts';
import { Fs, Path } from '../common.ts';
import { FileMap } from '../mod.ts';

describe('materialize', () => {
  const dir = Sample.source.dir;

  const makeBundle = async () => await FileMap.bundle(dir);

  it('writes files to target (no force)', async () => {
    const sample = Sample.init();
    const bundle = await makeBundle();
    const res = await FileMap.materialize(bundle, sample.target);
    expect(res.ops.some((o) => o.kind === 'write')).to.eql(true);
  });

  it('skip existing when !force', async () => {
    const sample = Sample.init();
    const bundle = await makeBundle();

    await FileMap.materialize(bundle, sample.target);
    const res = await FileMap.materialize(bundle, sample.target);
    expect(
      res.ops.every((o) => o.kind === 'skip' || o.kind === 'rename' || o.kind === 'modify'),
    ).to.eql(true);
    expect(res.ops.filter((o) => o.kind === 'write').length).to.eql(0);
  });

  it('force overwrite', async () => {
    const sample = Sample.init();
    const bundle = await makeBundle();

    await FileMap.materialize(bundle, sample.target);
    const res = await FileMap.materialize(bundle, sample.target, { force: true });
    expect(res.ops.some((o) => o.kind === 'write')).to.eql(true);
  });

  it('processFile: modify + rename + exclude', async () => {
    const sample = Sample.init();
    const bundle = await makeBundle();

    const res = await FileMap.materialize(bundle, sample.target, {
      processFile: async (e) => {
        if (e.path.endsWith('README.md') && e.text) {
          e.modify(e.text + '\n<!-- patched -->\n');
        }
        if (e.path === '.gitignore') {
          e.target.rename('.gitignore-renamed');
        }
        if (e.contentType.startsWith('image/')) {
          e.exclude('binary filtered');
        }
        // sanity: exists() is callable
        const existed = await e.target.exists();
        expect(existed).to.eql(false);
      },
    });

    const ops = res.ops.reduce<Record<string, number>>((acc, o) => {
      acc[o.kind] = (acc[o.kind] ?? 0) + 1;
      return acc;
    }, {});
    expect(await Fs.exists(Path.join(sample.target, '.gitignore-renamed'))).to.eql(true);
    expect((ops.modify ?? 0) >= 1).to.eql(true);
    expect((ops.skip ?? 0) >= 1).to.eql(true);
  });

  it('binary passthrough', async () => {
    const sample = Sample.init();
    const bundle = await makeBundle();

    await FileMap.materialize(bundle, sample.target, {
      processFile: (e) => {
        if (e.contentType.startsWith('image/')) {
          expect(!!e.bytes && !e.text).to.eql(true);
        }
      },
    });
  });
});
