import { buildSample } from '../u.build.ts';
import { selectPublication } from '../u.selection.ts';
import { readInputs } from '../../src/m.app/u.data.ts';
import { describe, expect, expectError, Fs, it } from './common.ts';
import { localFixture } from './u.fixture.ts';

describe('R2 deployment sample: one-build publication projections', () => {
  it('one build → disjoint payloads, exact original bytes/paths, and two verified manifests', async () => {
    await using f = await localFixture();
    const font = new Uint8Array([0, 255, 254, 128]); // Invalid UTF-8 catches text round-trips.
    let builds = 0;
    const { selection } = await buildSample(f.config, f.dir.absolute, (args) => {
      builds++;
      expect(args).to.eql({ root: f.dir.absolute, publicAssetBase: f.config.publicAssetBase });
      return f.emit('fixture shell', { 'images/logo.svg': '<svg />', 'fonts/ui.woff2': font });
    });
    expect(builds).to.eql(1);
    const selected = await selectPublication(selection, f.dir.absolute);
    expect(selected.private.files).to.eql(['dist.json', 'index.html']);
    expect(selected.public.files).to.eql([
      'app.css',
      'app.js',
      'dist.json',
      'fonts/ui.woff2',
      'images/logo.svg',
    ]);
    for (const audience of ['private', 'public'] as const) {
      for (const path of selected[audience].files.filter((file) => file !== 'dist.json')) {
        const original = await Fs.read(f.dir.join('dist', path));
        const projected = await Fs.read(f.dir.join(`dist.${audience}`, path));
        expect(original.ok, path).to.eql(true);
        expect(projected.ok, path).to.eql(true);
        expect(projected.data, path).to.eql(original.data);
      }
    }
    expect((await Fs.read(f.dir.join('dist.public/fonts/ui.woff2'))).data).to.eql(font);
    expect((await readInputs(f.dir.absolute)).selection).to.eql(selection);
  });

  it('captures the public base before the builder yields; later config cannot retarget old HTML', async () => {
    await using f = await localFixture();
    const config = { ...f.config };
    const base = config.publicAssetBase;
    const { selection } = await buildSample(config, f.dir.absolute, async (args) => {
      await Promise.resolve();
      config.publicAssetBase = 'https://other.example.test/sample/ui/';
      await Fs.writeJson(f.dir.join('r2.config.json'), config, { throw: true });
      expect(args.publicAssetBase).to.eql(base);
      return await f.emit(`<script type="module" src="${args.publicAssetBase}app.js"></script>`);
    });
    expect(selection.publicAssetBase).to.eql(base);
    const html = await Fs.readText(f.dir.join('dist.private/index.html'));
    expect(html.data).to.eql(`<script type="module" src="${base}app.js"></script>`);
    await expectError(() => readInputs(f.dir.absolute), 'Sample public asset base changed.');
  });

  it('rebuild removes stale generated outputs without copying unrelated/private task inputs', async () => {
    await using f = await localFixture();
    await Fs.write(f.dir.join('dist.public/stale.js'), 'stale', { throw: true });
    await Fs.write(f.dir.join('dist.private/other.html'), 'stale', { throw: true });
    await Fs.write(f.dir.join('private-input.json'), 'not frontend data', { throw: true });
    await Fs.write(f.dir.join('.tmp/keep.txt'), 'unrelated', { throw: true });
    const selection = await f.build();
    const selected = await selectPublication(selection, f.dir.absolute);
    expect(selected.public.files).to.eql(['app.css', 'app.js', 'dist.json']);
    expect(selected.private.files).to.eql(['dist.json', 'index.html']);
    expect((await Fs.readText(f.dir.join('.tmp/keep.txt'))).data).to.eql('unrelated');
    expect((await Fs.readText(f.dir.join('private-input.json'))).data).to.eql('not frontend data');
  });

  it('failed or thrown build → no publishable selection or old projection fallback', async () => {
    for (const throws of [false, true]) {
      await using f = await localFixture();
      await expectError(() =>
        buildSample(f.config, f.dir.absolute, () => {
          if (throws) throw new Error('fixture builder failure');
          return Promise.resolve({ ok: false, toString: () => 'failed fixture' });
        })
      );
      expect(await Fs.exists(f.dir.join('dist.selection.json'))).to.eql(false);
      expect(await Fs.exists(f.dir.join('dist.private'))).to.eql(false);
      expect(await Fs.exists(f.dir.join('dist.public'))).to.eql(false);
    }
  });

  describe('unadmitted output roles', () => {
    const paths = ['other.html', 'sw.js', 'worker.123.js', 'source.ts', 'app.js.map', 'secret.pem'];
    for (const path of paths) {
      it(`${path} → no selected build`, async () => {
        await using f = await localFixture();
        await expectError(
          () => f.build('shell', { [path]: 'unadmitted role' }),
          'manifest filenames',
        );
        expect(await Fs.exists(f.dir.join('dist.selection.json'))).to.eql(false);
      });
    }
  });

  it('mixed generation bytes → failure against the captured pair, not another selection', async () => {
    await using f = await localFixture();
    const next = await f.build('second', { 'app.js': 'export const generation = 2;' });
    const mixed = { ...next, public: f.selection.public };
    await expectError(
      () => selectPublication(mixed, f.dir.absolute),
      'Sample public Dist refused: integrity-mismatch.',
    );
    expect((await selectPublication(next, f.dir.absolute)).public.kind).to.eql('verified');
  });

  it('payload changed after manifest generation → no selected projections', async () => {
    await using f = await localFixture();
    const build = async () => {
      const built = await f.emit();
      await Fs.write(f.dir.join('dist/app.js'), 'changed after Dist generation', { throw: true });
      return built;
    };
    await expectError(
      () => buildSample(f.config, f.dir.absolute, build),
      'Sample Dist refused: content-mismatch.',
    );
    expect(await Fs.exists(f.dir.join('dist.selection.json'))).to.eql(false);
  });
});
