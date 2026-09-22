import { buildSample } from '../u.build.ts';
import { selectPublication } from '../u.selection.ts';
import { readInputs } from '../../src/m.app/u.data.ts';
import { describe, expect, expectError, Fs, it } from './common.ts';
import { localFixture } from './u.fixture.ts';

describe('R2 deployment sample: one-build publication projections', () => {
  it('one build → private HTML, public assets, and a reloadable build record', async () => {
    await using f = await localFixture();
    const font = new Uint8Array([0, 255, 254, 128]); // Invalid UTF-8 catches text round-trips.
    let builds = 0;
    const { buildRecord } = await buildSample(f.config, f.dir.absolute, (args) => {
      builds++;
      expect(args).to.eql({ root: f.dir.absolute, publicAssetBase: f.config.publicAssetBase });
      return f.emit('fixture shell', { 'images/logo.svg': '<svg />', 'fonts/ui.woff2': font });
    });
    expect(builds).to.eql(1);
    const selected = await selectPublication(buildRecord.selection, f.dir.absolute);
    expect(selected.private).to.eql(['dist.json', 'index.html']);
    expect(selected.public).to.eql([
      'app.css',
      'app.js',
      'dist.json',
      'fonts/ui.woff2',
      'images/logo.svg',
    ]);
    expect((await readInputs(f.dir.absolute)).buildRecord).to.eql(buildRecord);
    expect((await Fs.readJson(f.dir.join('dist.pins.json'))).data).to.eql(buildRecord);
    expect(await Fs.exists(f.dir.join('dist.selection.json'))).to.eql(false);
    expect(Object.keys(buildRecord)).to.eql(['publicAssetBase', 'selection']);
    expect(Object.keys(buildRecord.selection)).to.eql(['pins']);
  });

  it('captures the public base before the builder yields; later config cannot retarget old HTML', async () => {
    await using f = await localFixture();
    const config = { ...f.config };
    const base = config.publicAssetBase;
    const { buildRecord } = await buildSample(config, f.dir.absolute, async (args) => {
      await Promise.resolve();
      config.publicAssetBase = 'https://other.example.test/sample/ui/';
      await Fs.writeJson(f.dir.join('r2.config.json'), config, { throw: true });
      expect(args.publicAssetBase).to.eql(base);
      return await f.emit(`<script type="module" src="${args.publicAssetBase}app.js"></script>`);
    });
    expect(buildRecord.publicAssetBase).to.eql(base);
    const html = await Fs.readText(f.dir.join('dist.private/index.html'));
    expect(html.data).to.eql(`<script type="module" src="${base}app.js"></script>`);
    await expectError(() => readInputs(f.dir.absolute), 'Run deno task build');
  });

  it('rebuild removes stale generated outputs without copying unrelated/private task inputs', async () => {
    await using f = await localFixture();
    await Fs.write(f.dir.join('dist.public/stale.js'), 'stale', { throw: true });
    await Fs.write(f.dir.join('dist.private/other.html'), 'stale', { throw: true });
    await Fs.write(f.dir.join('private-input.json'), 'not frontend data', { throw: true });
    await Fs.write(f.dir.join('.tmp/keep.txt'), 'unrelated', { throw: true });
    await Fs.writeJson(f.dir.join('dist.selection.json'), f.buildRecord, { throw: true });
    const buildRecord = await f.build();
    expect(await Fs.exists(f.dir.join('dist.selection.json'))).to.eql(false);
    const selected = await selectPublication(buildRecord.selection, f.dir.absolute);
    expect(selected.public).to.eql(['app.css', 'app.js', 'dist.json']);
    expect(selected.private).to.eql(['dist.json', 'index.html']);
    expect((await Fs.readText(f.dir.join('.tmp/keep.txt'))).data).to.eql('unrelated');
    expect((await Fs.readText(f.dir.join('private-input.json'))).data).to.eql('not frontend data');
  });

  it('failed or thrown build → no publishable selection or old projection fallback', async () => {
    for (const throws of [false, true]) {
      await using f = await localFixture();
      await Fs.writeJson(f.dir.join('dist.selection.json'), f.buildRecord, { throw: true });
      await Fs.writeJson(f.dir.join('dist.pins.json'), f.buildRecord, { throw: true });
      await Fs.writeJson(f.dir.join('dist.unrelated.json'), { keep: true }, { throw: true });
      let observed: boolean[] | undefined;
      const failure = new Error('fixture builder failure');
      const error = await expectError(() =>
        buildSample(f.config, f.dir.absolute, async () => {
          observed = [
            await Fs.exists(f.dir.join('dist.pins.json')),
            await Fs.exists(f.dir.join('dist.selection.json')),
          ];
          if (throws) throw failure;
          return { ok: false, toString: () => 'failed fixture' };
        })
      );
      expect(observed).to.eql([false, false]);
      if (throws) expect(error).to.equal(failure);
      else expect(error.message).to.eql('Sample UI build failed.');
      expect(await Fs.exists(f.dir.join('dist.selection.json'))).to.eql(false);
      expect(await Fs.exists(f.dir.join('dist.pins.json'))).to.eql(false);
      expect((await Fs.readJson(f.dir.join('dist.unrelated.json'))).data).to.eql({ keep: true });
      expect(await Fs.exists(f.dir.join('dist.private'))).to.eql(false);
      expect(await Fs.exists(f.dir.join('dist.public'))).to.eql(false);
    }
  });

  it('either record invalidation fails → preserve the denial and never touch outputs or build', async () => {
    for (const filename of ['dist.pins.json', 'dist.selection.json']) {
      await using f = await localFixture();
      await Fs.writeJson(f.dir.join('dist.selection.json'), f.buildRecord, { throw: true });
      const target = f.dir.join(filename);
      const denied = new Deno.errors.NotCapable('Synthetic fixture removal denial.');
      const remove = Deno.remove;
      let builds = 0;
      // Replace only the host removal boundary; all surrounding filesystem work remains real.
      Deno.remove = (path, options) =>
        path === target ? Promise.reject(denied) : remove(path, options);
      try {
        const error = await expectError(() =>
          buildSample(f.config, f.dir.absolute, () => {
            builds++;
            return f.emit();
          })
        );
        expect(error).to.equal(denied);
      } finally {
        Deno.remove = remove;
      }
      expect(builds).to.eql(0);
      expect(await Fs.exists(target)).to.eql(true);
      expect(await Fs.exists(f.dir.join('dist.private/index.html'))).to.eql(true);
      expect(await Fs.exists(f.dir.join('dist.public/app.js'))).to.eql(true);
    }
  });

  describe('unadmitted output roles', () => {
    const paths = ['other.html', 'sw.js', 'worker.123.js', 'source.ts', 'app.js.map', 'secret.pem'];
    for (const path of paths) {
      it(`${path} → no selected build`, async () => {
        await using f = await localFixture();
        await expectError(
          () => f.build('shell', { [path]: 'unadmitted role' }),
          'select/policy-failure',
        );
        expect(await Fs.exists(f.dir.join('dist.pins.json'))).to.eql(false);
      });
    }
  });

  it('old public pin with rebuilt files → checksum mismatch', async () => {
    await using f = await localFixture();
    const next = await f.build('second', { 'app.js': 'export const generation = 2;' });
    const mixed = {
      pins: { ...next.selection.pins, public: f.buildRecord.selection.pins.public },
    };
    await expectError(
      () => selectPublication(mixed, f.dir.absolute),
      'Sample public Dist refused: integrity-mismatch.',
    );
    expect((await selectPublication(next.selection, f.dir.absolute)).public).to.eql([
      'app.css',
      'app.js',
      'dist.json',
    ]);
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
      'Sample projection refused: source/content-mismatch.',
    );
    expect(await Fs.exists(f.dir.join('dist.pins.json'))).to.eql(false);
  });
});
