import { CompositeHash, Hash } from '@sys/crypto/hash';
import { describe, expect, expectError, it, Json, type t } from '../-test.ts';
import { appFrom, DIST_LIMITS } from '../m.deployment/mod.ts';
import { fixtureEnv, remoteFixture } from './u.fixture.ts';

const encoder = new TextEncoder();

describe('R2 deployment sample: pinned manifest bootstrap', () => {
  it('manifest admission → whole app, without local build output', async () => {
    using f = await remoteFixture();
    const app = await appFrom(f, fixtureEnv);
    expect(f.keys()).to.eql(['sample/ui/dist.json']);
    const response = await app.fetch(new Request('http://sample.test/api/hello'));
    expect(response.status).to.eql(200);
    await response.body?.cancel();
    expect(f.fetched.length).to.eql(1);
  });

  describe('manifest acquisition and admission', () => {
    const cases = [
      {
        name: 'wrong checksum',
        bytes: encoder.encode('wrong'),
        status: 200,
        expected: 'integrity-mismatch',
      },
      {
        name: 'oversized body',
        bytes: new Uint8Array(DIST_LIMITS.manifestBytes + 1),
        status: 200,
        expected: 'HTTP 413',
      },
      { name: 'missing object', bytes: null, status: 404, expected: 'HTTP 404' },
    ];
    for (const item of cases) {
      it(`${item.name} → no app and no retry`, async () => {
        using f = await remoteFixture();
        f.read = () => Promise.resolve(new Response(item.bytes, { status: item.status }));
        await expectError(() => appFrom(f, fixtureEnv), item.expected);
        expect(f.keys()).to.eql(['sample/ui/dist.json']);
      });
    }
  });

  it('checksum-matched invalid manifest → no app', async () => {
    using f = await remoteFixture();
    f.dist.build.size.total++;
    const bytes = encoder.encode(Json.stringify(f.dist));
    f.content.set('dist.json', bytes);
    f.pin['dist.json'] = Hash.sha256(bytes);
    await expectError(() => appFrom(f, fixtureEnv), 'Sample manifest refused: malformed.');
    expect(f.fetched.length).to.eql(1);
  });

  it('a checksum-matched private manifest cannot admit public asset relay routes', async () => {
    using f = await remoteFixture();
    const asset = f.content.get('pkg/file.js')!;
    f.dist.hash.parts['pkg/file.js'] = `${Hash.sha256(asset)}:size=${asset.length}`;
    f.dist.build.size.total += asset.length;
    f.dist.build.size.pkg += asset.length;
    f.dist.hash.digest = CompositeHash.digest(f.dist.hash.parts);
    const bytes = encoder.encode(Json.stringify(f.dist));
    f.content.set('dist.json', bytes);
    f.pin['dist.json'] = Hash.sha256(bytes);
    await expectError(() => appFrom(f, fixtureEnv), 'Invalid sample private manifest filenames.');
    expect(f.keys()).to.eql(['sample/ui/dist.json']);
  });

  it('invalid pin or target → refusal before credentials or storage', async () => {
    using f = await remoteFixture();
    let credentials = 0;
    const env = {
      get() {
        credentials++;
        return 'fixture-only-credential';
      },
    };
    const pins = [
      { integrity: f.pin['dist.json'], files: ['index.html', 'dist.json'] },
      { ...f.pin, files: ['index.html'] },
      { 'dist.json': `${f.pin['dist.json']}:size=1` },
    ];
    for (const pin of pins) {
      await expectError(() =>
        appFrom({
          ...f,
          buildRecord: {
            ...f.buildRecord,
            selection: { pins: { ...f.buildRecord.selection.pins, private: pin as t.DistPin } },
          },
        }, env), 'Invalid sample build record.');
    }
    await expectError(() =>
      appFrom({
        ...f,
        config: { ...f.config, targets: { ...f.config.targets, private: f.config.targets.public } },
      }, env), 'Invalid sample configuration.');
    expect(credentials).to.eql(0);
    expect(f.fetched).to.eql([]);
  });

  it('startup admission does not cache or verify later payload bytes', async () => {
    using f = await remoteFixture();
    const app = await appFrom(f, fixtureEnv);
    f.content.set('dist.json', encoder.encode('{}'));
    f.content.set('index.html', encoder.encode('changed shell'));
    const shell = await app.fetch(new Request('http://sample.test/ui/'));
    expect(await shell.text()).to.eql('changed shell');
    const manifest = await app.fetch(new Request('http://sample.test/ui/dist.json'));
    expect(await manifest.text()).to.eql('{}');
    const missing = await app.fetch(new Request('http://sample.test/ui/pkg/file.js'));
    expect(missing.status).to.eql(404);
    expect(f.keys()).to.eql(['sample/ui/dist.json', 'sample/ui/index.html', 'sample/ui/dist.json']);
  });

  it('changed recorded base → no credential lookup or storage', async () => {
    using f = await remoteFixture();
    const inputs = {
      ...f,
      buildRecord: { ...f.buildRecord, publicAssetBase: 'https://other.example.test/sample/ui/' },
    };
    const names: string[] = [];
    await expectError(() =>
      appFrom(inputs, {
        get(name) {
          names.push(name);
          return 'fixture-only-credential';
        },
      }), 'Run deno task build');
    expect(names).to.eql([]);
    expect(f.fetched).to.eql([]);
  });

  it('credential callbacks → entry retains target, base, pins, and credential names', async () => {
    using f = await remoteFixture();
    const config = {
      ...f.config,
      targets: { ...f.config.targets, private: { ...f.config.targets.private } },
      credentials: { ...f.config.credentials, serve: { ...f.config.credentials.serve } },
    };
    const pin = { ...f.pin };
    const buildRecord = {
      ...f.buildRecord,
      selection: { pins: { ...f.buildRecord.selection.pins, private: pin } },
    };
    const names: string[] = [];
    const app = await appFrom({ config, buildRecord }, {
      get(name) {
        names.push(name);
        config.targets.private.prefix = 'other/ui';
        config.credentials.serve.secretAccessKey = 'OTHER_SECRET';
        config.publicAssetBase = 'https://other.example.test/sample/ui/';
        buildRecord.publicAssetBase = config.publicAssetBase;
        buildRecord.selection.pins.public['dist.json'] = 'invalid after capture';
        pin['dist.json'] = Hash.sha256('other');
        return 'fixture-only-credential';
      },
    });
    expect(names).to.eql([
      f.config.credentials.serve.accessKeyId,
      f.config.credentials.serve.secretAccessKey,
    ]);
    expect(f.keys()).to.eql(['sample/ui/dist.json']);
    const response = await app.fetch(new Request('http://sample.test/api/hello'));
    expect(response.status).to.eql(200);
  });

  it('cancelled bootstrap → no app', async () => {
    for (const preCancelled of [true, false]) {
      using f = await remoteFixture();
      const controller = new AbortController();
      if (preCancelled) controller.abort();
      f.read = () => {
        controller.abort();
        return Promise.resolve(new Response(new Uint8Array(f.manifest)));
      };
      await expectError(() => appFrom(f, fixtureEnv, controller.signal), '499');
      expect(f.fetched.length).to.eql(preCancelled ? 0 : 1);
    }
  });
});
