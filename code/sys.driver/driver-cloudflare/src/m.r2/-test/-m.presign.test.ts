import { describe, expect, expectError, Is, it, type t, WebFixture } from '../../-test.ts';
import { S3Client } from '../common.ts';
import { R2 } from '../mod.ts';
import { accountId, credentials, fakeBucket, fakeTransport } from './u.fixture.ts';

const requestDate = new Date('2026-09-15T12:00:00.000Z');

describe('R2 presigned object GETs', () => {
  it('signs with the pinned SDK → exact bucket, key, GET, expiry and zero fetches', async () => {
    let fetched = 0;
    using _fetch = WebFixture.Fetch.mock(() => {
      fetched++;
      throw new Error('Presigning must not fetch');
    });
    const original = S3Client.prototype.getPresignedUrl;
    const calls: unknown[] = [];
    using _signer = WebFixture.Property.mock([{
      target: S3Client.prototype,
      key: 'getPresignedUrl',
      descriptor: {
        value: function (this: S3Client, ...args: Parameters<S3Client['getPresignedUrl']>) {
          calls.push(args);
          const [method, key, options] = args;
          return original.call(this, method, key, { ...options, requestDate });
        },
      },
    }]);
    const bucket = R2.Service.create({ accountId, credentials }).bucket('assets', {
      readOrigin: 'https://public.example.com',
    });
    const key = 'reports/space + percent%23 # @=é/文件-😀._~.txt';
    const sign = signer(bucket);
    const url = new URL(await sign(key, { expirySeconds: 60 }));
    const params = url.searchParams;
    const signature = params.get('X-Amz-Signature');
    expect(url.origin).to.equal(`https://${accountId}.r2.cloudflarestorage.com`);
    expect(decodeURIComponent(url.pathname)).to.equal(`/assets/${key}`);
    expect(new Request(url).url).to.equal(url.href);
    expect(url.hash).to.equal('');
    expect(params.get('X-Amz-Algorithm')).to.equal('AWS4-HMAC-SHA256');
    expect(params.get('X-Amz-Credential')).to.equal('access-key/20260915/auto/s3/aws4_request');
    expect(params.get('X-Amz-Date')).to.equal('20260915T120000Z');
    expect(params.get('X-Amz-Expires')).to.equal('60');
    expect(params.get('X-Amz-SignedHeaders')).to.equal('host');
    expect(params.get('X-Amz-Security-Token')).to.equal(null);
    expect(signature).to.match(/^[a-f0-9]{64}$/);
    expect(url.href).not.to.include(credentials.secretAccessKey);
    expect(calls).to.eql([['GET', key, { bucketName: 'assets', expirySeconds: 60 }]]);

    const client = new S3Client({
      endPoint: bucketOrigin(),
      region: 'auto',
      accessKey: credentials.accessKeyId,
      secretKey: credentials.secretAccessKey,
      bucket: 'assets',
      pathStyle: true,
    });
    // Same-SDK comparison proves adapter fidelity, not independent SigV4 correctness.
    const options = { expirySeconds: 60, requestDate };
    const expected = await original.call(client, 'GET', key, options);
    expect(url.href).to.equal(expected);
    for (const method of ['HEAD', 'PUT', 'DELETE'] as const) {
      const other = new URL(await original.call(client, method, key, options));
      const otherSignature = other.searchParams.get('X-Amz-Signature');
      expect(otherSignature, method).not.to.equal(signature);
    }
    expect(fetched).to.equal(0);
  });

  it('preserves session tokens at the minimum and maximum expiry without fetching', async () => {
    let fetched = 0;
    using _fetch = WebFixture.Fetch.mock(() => {
      fetched++;
      throw new Error('Presigning must not fetch');
    });
    const sessionToken = 'session+/=:%?#&';
    const bucket = R2.Service.create({
      accountId,
      credentials: { ...credentials, sessionToken },
    }).bucket('other-bucket');
    const sign = signer(bucket);
    for (const expirySeconds of [1, 604800]) {
      const url = new URL(await sign('dir/file.txt', { expirySeconds }));
      expect(url.pathname).to.equal('/other-bucket/dir/file.txt');
      expect(url.searchParams.get('X-Amz-Security-Token')).to.equal(sessionToken);
      expect(url.searchParams.get('X-Amz-Expires')).to.equal(String(expirySeconds));
    }
    expect(fetched).to.equal(0);
  });

  it('preserves literal keys through URL and Request parsing, up to 1,024 UTF-8 bytes', async () => {
    let fetched = 0;
    using _fetch = WebFixture.Fetch.mock(() => {
      fetched++;
      throw new Error('Presigning must not fetch');
    });
    const bucket = R2.Service.create({ accountId, credentials }).bucket('assets');
    const sign = signer(bucket);
    const keys = [
      ' leading and trailing ',
      '%2e%2e/%2F',
      'a+b#c',
      'a'.repeat(1024),
      'é'.repeat(512),
      '😀'.repeat(256),
    ];
    for (const key of keys) {
      const url = await sign(key, { expirySeconds: 30 });
      const requestUrl = new URL(new Request(url).url);
      const objectPath = decodeURIComponent(requestUrl.pathname);
      expect(objectPath, key).to.equal(`/assets/${key}`);
      expect(requestUrl.hash).to.equal('');
    }
    expect(fetched).to.equal(0);
  });

  it('rejects unsupported keys and expiries before calling the pinned signer', async () => {
    let signed = 0;
    let fetched = 0;
    using _fetch = WebFixture.Fetch.mock(() => {
      fetched++;
      throw new Error('Presigning must not fetch');
    });
    using _signer = WebFixture.Property.mock([{
      target: S3Client.prototype,
      key: 'getPresignedUrl',
      descriptor: {
        value: () => {
          signed++;
          throw new Error('Unexpected signer call');
        },
      },
    }]);
    const sign = signer(R2.Service.create({ accountId, credentials }).bucket('assets'));
    const cases: { reason: string; keys: unknown[] }[] = [
      { reason: 'blank', keys: ['', ' ', '\u00a0'] },
      { reason: 'empty segment', keys: ['/a', 'a//b', 'a/'] },
      { reason: 'dot segment', keys: ['./a', '../a', 'a/./b', 'a/../b'] },
      { reason: 'query separator', keys: ['reports/report?', 'a?versionId=other'] },
      { reason: 'backslash', keys: ['a\\b'] },
      { reason: 'AWS escaping', keys: ["a'b", 'a!b', 'a(b', 'a)b', 'a*b'] },
      { reason: 'control character', keys: ['a\u0000b', 'a\nb', 'a\u007fb', 'a\u0085b'] },
      { reason: 'unpaired surrogate', keys: ['\ud800', '\udc00'] },
      { reason: 'ASCII byte limit', keys: ['a'.repeat(1025)] },
      { reason: 'UTF-8 byte limit', keys: ['é'.repeat(513), '😀'.repeat(256) + 'a'] },
      { reason: 'non-string', keys: [null, undefined, 123] },
    ];
    // These casts deliberately exercise invalid runtime input through the public API.
    for (const { reason, keys } of cases) {
      for (const key of keys) {
        const error = await expectError(() => sign(key as string, { expirySeconds: 60 }));
        expect(Is.error(error), reason).to.equal(true);
        expect(String(error), reason).to.include('R2 presigned GET key');
        expect(String(error), reason).not.to.include('reports/report');
        expect(signed, reason).to.equal(0);
      }
    }
    const expiries = [undefined, null, '60', NaN, Infinity, -Infinity, 0, -1, 0.5, 1.5, 604801];
    for (const expirySeconds of expiries) {
      const options = { expirySeconds } as t.R2.Bucket.PresignGetOptions;
      const error = await expectError(() => sign('a', options));
      expect(String(error), String(expirySeconds)).to.include('expirySeconds');
    }
    for (const options of [undefined, null, {}]) {
      const error = await expectError(() => sign('a', options as t.R2.Bucket.PresignGetOptions));
      expect(String(error)).to.include('expirySeconds');
    }
    expect(signed).to.equal(0);
    expect(fetched).to.equal(0);
  });

  it('passes accepted keys unchanged and only the expiry option to an injected signer', async () => {
    const calls: unknown[] = [];
    let receiver: unknown;
    const transport: t.R2.Bucket.Transport = {
      ...fakeTransport()({
        accountId,
        credentials,
        bucketName: 'assets',
        storageUrl: bucketOrigin(),
      }),
      presignGet(key, options) {
        receiver = this;
        calls.push([key, options]);
        return Promise.resolve('https://signed.example.com/object');
      },
    };
    const service = R2.Service.create({ accountId, credentials, transport: () => transport });
    const bucket = service.bucket('assets');
    const sign = signer(bucket);
    const keys = [' leading and trailing ', 'a%2Fb', 'a%2e%2e/b', 'a+b#c', 'é'.repeat(512)];
    for (const key of keys) {
      const options = {
        expirySeconds: 30,
        bucketName: 'other',
        parameters: { admin: 'true' },
        method: 'PUT',
      };
      expect(await sign(key, options)).to.equal('https://signed.example.com/object');
    }
    expect(calls).to.eql(keys.map((key) => [key, { expirySeconds: 30 }]));
    expect(receiver).to.equal(transport);
    expect(Object.isFrozen(bucket)).to.equal(true);
    await expectError(() => sign('a?', { expirySeconds: 30 }));
    await expectError(() => sign('a', { expirySeconds: NaN }));
    expect(calls.length).to.equal(keys.length);
  });

  it('propagates an injected signer failure without falling back to native signing', async () => {
    let signed = 0;
    using _signer = WebFixture.Property.mock([{
      target: S3Client.prototype,
      key: 'getPresignedUrl',
      descriptor: {
        value: () => {
          signed++;
          throw new Error('Unexpected native fallback');
        },
      },
    }]);
    const failure = new Error('Injected signer failed');
    const transport: t.R2.Bucket.TransportFactory = (context) => ({
      ...fakeTransport()(context),
      presignGet: () => Promise.reject(failure),
    });
    const bucket = R2.Service.create({ accountId, credentials, transport }).bucket('assets');
    const sign = signer(bucket);
    const error = await expectError(() => sign('file.txt', { expirySeconds: 60 }));
    expect(error).to.equal(failure);
    expect(signed).to.equal(0);
  });

  it('legacy injected buckets/transports remain usable without a native signing fallback', async () => {
    let signed = 0;
    using _signer = WebFixture.Property.mock([{
      target: S3Client.prototype,
      key: 'getPresignedUrl',
      descriptor: {
        value: () => {
          signed++;
          throw new Error('Unexpected native fallback');
        },
      },
    }]);
    const calls: unknown[] = [];
    const transport = fakeTransport(calls);
    const service = R2.Service.create({ accountId, credentials, transport });
    const bucket = service.bucket('assets');
    expect(bucket.presignGet).to.equal(undefined);
    expect(fakeBucket().bucket.presignGet).to.equal(undefined);
    const response = await bucket.read('reports/report?');
    expect(await response.text()).to.equal('hello');
    expect(calls).to.eql([['read', 'reports/report?']]);
    expect(signed).to.equal(0);
  });
});

/** Fail the test if the bucket does not support presigned GETs. */
function signer(bucket: t.R2.Bucket) {
  if (!Is.func(bucket.presignGet)) throw new Error('Expected presigned GET capability');
  return bucket.presignGet;
}

function bucketOrigin() {
  return `https://${accountId}.r2.cloudflarestorage.com`;
}
