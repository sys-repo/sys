import { describe, expect, Fs, it } from '../-test.ts';
import { configFrom, selectionFrom, snapshotInputs } from '../m.app/u.selection.ts';
import { fixtureConfig } from './u.config.ts';

describe('R2 deployment sample: target configuration', () => {
  it('sample defaults → one environment pair for serving and both publishing roles', async () => {
    const path = Fs.Path.fromFileUrl(new URL('../../r2.config.json', import.meta.url));
    const { data } = await Fs.readJson(path);
    const { credentials } = configFrom(data);
    const shared = {
      accessKeyId: 'SYS_TEST_R2_KEY_ID',
      secretAccessKey: 'SYS_TEST_R2_KEY_SECRET',
    };
    expect(credentials).to.eql({ serve: shared, pushPrivate: shared, pushPublic: shared });
  });

  it('captures two buckets, the public URL mapping, and operation-specific credential names', () => {
    const config = fixtureConfig();
    const captured = configFrom(config);
    config.targets.private.prefix = 'other';
    config.credentials.serve.accessKeyId = 'OTHER_KEY';
    expect(captured).to.eql(fixtureConfig());
    expect(Object.isFrozen(captured)).to.eql(true);
  });

  it('refuses an ambiguous target or a public URL outside the configured key mapping', () => {
    const config = fixtureConfig();
    const cases = [
      { ...config, targets: { ...config.targets, public: config.targets.private } },
      { ...config, publicAssetBase: 'http://assets.example.test/sample/ui/' },
      { ...config, publicAssetBase: 'https://user:secret@assets.example.test/sample/ui/' },
      { ...config, publicAssetBase: 'https://assets.example.test/other/' },
      { ...config, publicAssetBase: `${config.publicAssetBase}?signature=secret` },
      { ...config, publicAssetBase: `${config.publicAssetBase}#fragment` },
      { ...config, publicAssetBase: config.publicAssetBase.slice(0, -1) },
      {
        ...config,
        targets: { ...config.targets, private: { bucket: 'private', prefix: '../ui' } },
      },
      { ...config, bucket: 'legacy-target' },
    ];
    for (const value of cases) {
      expect(() => configFrom(value)).to.throw('Invalid sample configuration.');
    }
  });
});

describe('R2 deployment sample: build selection', () => {
  it('caller mutation → captured pins, public base, and configuration remain unchanged', () => {
    const config = fixtureConfig();
    const selection = {
      private: { 'dist.json': `sha256-${'a'.repeat(64)}` },
      public: { 'dist.json': `sha256-${'b'.repeat(64)}` },
      publicAssetBase: config.publicAssetBase,
    };
    const captured = snapshotInputs(config, selection);
    config.targets.public.prefix = 'other';
    config.credentials.serve.secretAccessKey = 'OTHER_SECRET';
    selection.private['dist.json'] = `sha256-${'c'.repeat(64)}`;
    selection.public['dist.json'] = `sha256-${'d'.repeat(64)}`;
    selection.publicAssetBase = 'https://other.example.test/other/';
    expect(captured.config).to.eql(fixtureConfig());
    expect(captured.selection).to.eql({
      private: { 'dist.json': `sha256-${'a'.repeat(64)}` },
      public: { 'dist.json': `sha256-${'b'.repeat(64)}` },
      publicAssetBase: fixtureConfig().publicAssetBase,
    });
    expect(Object.isFrozen(captured.selection.private)).to.eql(true);
    expect(Object.isFrozen(captured.config.credentials.serve)).to.eql(true);
  });

  it('refuses partial wrappers, inventories, noncanonical pins, and configured-base changes', () => {
    const config = fixtureConfig();
    const pin = { 'dist.json': `sha256-${'a'.repeat(64)}` };
    const selection = { private: pin, public: pin, publicAssetBase: config.publicAssetBase };
    const invalid = [
      pin,
      { private: pin, publicAssetBase: config.publicAssetBase },
      { ...selection, files: ['index.html'] },
      { ...selection, public: { ...pin, files: [] } },
      { ...selection, private: { 'dist.json': `${pin['dist.json']}:size=1` } },
    ];
    for (const value of invalid) {
      expect(() => selectionFrom(value)).to.throw('Invalid sample build selection.');
    }
    expect(() =>
      snapshotInputs(config, {
        ...selection,
        publicAssetBase: 'https://other.example.test/sample/ui/',
      })
    ).to.throw('Sample public asset base changed.');
  });
});
