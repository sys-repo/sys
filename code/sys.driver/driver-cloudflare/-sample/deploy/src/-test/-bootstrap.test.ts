import { CompositeHash, Hash } from '@sys/crypto/hash';
import { describe, expect, expectError, it, Json, type t } from '../-test.ts';
import { appFrom } from '../entry.ts';
import { createApp } from '../m.app/mod.ts';
import { DIST_LIMITS } from '../m.app/u.selection.ts';
import { remoteFixture } from './u.fixture.ts';

const encoder = new TextEncoder();

describe('R2 deployment sample: pinned manifest bootstrap', () => {
  it('manifest admission → whole app, without local build output', async () => {
    using f = await remoteFixture();
    const app = await createApp(f);
    expect(f.signed).to.eql(['sample/ui/dist.json']);
    expect(f.fetched.length).to.eql(1);

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
        await expectError(() => createApp(f), item.expected);
        expect(f.signed).to.eql(['sample/ui/dist.json']);
        expect(f.fetched.length).to.eql(1);
      });
    }
  });

  it('checksum-matched invalid manifest → no app', async () => {
    using f = await remoteFixture();
    f.dist.build.size.total++;
    const bytes = encoder.encode(Json.stringify(f.dist));
    f.content.set('dist.json', bytes);
    f.pin['dist.json'] = Hash.sha256(bytes);
    await expectError(() => createApp(f), 'Sample manifest refused: malformed.');
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
    await expectError(() => createApp(f), 'Invalid sample private manifest filenames.');
    expect(f.signed).to.eql(['sample/ui/dist.json']);
  });

  it('invalid pin or target → refusal before storage', async () => {
    using f = await remoteFixture();
    const pins = [
      { integrity: f.pin['dist.json'], files: ['index.html', 'dist.json'] },
      { ...f.pin, files: ['index.html'] },
      { 'dist.json': `${f.pin['dist.json']}:size=1` },
    ];
    for (const pin of pins) {
      await expectError(
        () =>
          createApp({
            ...f,
            buildRecord: {
              ...f.buildRecord,
              selection: { pins: { ...f.buildRecord.selection.pins, private: pin as t.DistPin } },
            },
          }),
        'Invalid sample build record.',
      );
    }
    await expectError(() => createApp({ ...f, bucket: { name: 'other' } }), 'bucket');
    expect(f.signed).to.eql([]);
    expect(f.fetched).to.eql([]);
  });

  it('mutation during signing → retained config, pin, signer, and route inventory', async () => {
    using f = await remoteFixture();
    const config = {
      ...f.config,
      targets: { ...f.config.targets, private: { ...f.config.targets.private } },
    };
    const pin = { ...f.pin };
    const sign = f.bucket.presignGet;
    f.bucket.presignGet = (key) => {
      config.targets.private.prefix = 'other/ui';
      pin['dist.json'] = Hash.sha256('other');
      f.bucket.name = 'other';
      f.bucket.presignGet = () => {
        throw new Error('replacement signer');
      };
      return sign(key);
    };
    const app = await createApp({
      config,
      buildRecord: {
        ...f.buildRecord,
        selection: { pins: { ...f.buildRecord.selection.pins, private: pin } },
      },
      bucket: f.bucket,
    });
    f.content.set('dist.json', encoder.encode('{}'));
    f.content.set('index.html', encoder.encode('changed shell'));
    const shell = await app.fetch(new Request('http://sample.test/ui/'));
    expect(await shell.text()).to.eql('changed shell'); // Relay, not per-response content verification.
    const missing = await app.fetch(new Request('http://sample.test/ui/pkg/file.js'));
    expect(missing.status).to.eql(404);
    expect(f.signed).to.eql(['sample/ui/dist.json', 'sample/ui/index.html']);
  });

  it('changed recorded base → no credential lookup or storage at either startup boundary', async () => {
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
    await expectError(() => createApp(inputs), 'Run deno task build');
    expect(names).to.eql([]);
    expect(f.signed).to.eql([]);
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
    const paths = f.fetched.map((req) => new URL(req.url).pathname);
    expect(paths).to.eql(['/sample-private/sample/ui/dist.json']);

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
      await expectError(() => createApp({ ...f, signal: controller.signal }), '499');
      expect(f.fetched.length).to.eql(preCancelled ? 0 : 1);
    }
  });
});
