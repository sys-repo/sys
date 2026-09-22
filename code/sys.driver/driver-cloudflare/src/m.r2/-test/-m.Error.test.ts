import { describe, Err, expect, expectError, Files, it, WebFixture } from '../../-test.ts';
import { requestFailure } from '../u/u.diagnostic.ts';
import { R2 } from '../mod.ts';
import { accountId, credentials, r2FilesPolicy as policy } from './u.fixture.ts';

describe('R2: safe request diagnostics', () => {
  it('S3 refusal → status and code survive Files/Cmd without provider text or credentials', async () => {
    let requests = 0;
    using _mock = WebFixture.Fetch.mock(() => {
      requests++;
      return Promise.resolve(
        new Response(
          '<Error><Code>AccessDenied</Code><Message>fixture-secret https://signed.invalid/?token=secret</Message></Error>',
          { status: 403, headers: { 'content-type': 'application/xml' } },
        ),
      );
    });
    const bucket = R2.Service.create({ accountId, credentials }).bucket('assets');
    using files = Files.Client.local(R2.Files.create({ bucket, policy }));
    const error = await expectError(() => files.writeBytes('index.html', new Uint8Array([1])));
    // A write starts by listing descendants: report the refused storage operation, not PUT.
    const detail = R2.Error.diagnostic(Err.std(error));
    expect(detail).to.eql({ operation: 'list', status: 403, code: 'AccessDenied' });
    if (!detail) throw new Error('Expected the storage diagnostic.');
    expect(R2.Error.format(detail)).to.eql('R2 list failed: HTTP 403, AccessDenied.');
    expect(Err.summary(error, { cause: true })).not.to.include('fixture-secret');
    expect(Err.summary(error, { cause: true })).not.to.include('signed.invalid');
    expect(requests).to.eql(1);
  });

  it('absent object → explicit Files absence survives Cmd without becoming an R2 request failure', async () => {
    using _mock = WebFixture.Fetch.mock((input, init) => {
      const req = new Request(input, init);
      if (req.method === 'HEAD') return Promise.resolve(new Response(null, { status: 404 }));
      if (req.method === 'GET' && new URL(req.url).searchParams.has('list-type')) {
        return Promise.resolve(
          new Response(
            '<ListBucketResult><IsTruncated>false</IsTruncated></ListBucketResult>',
          ),
        );
      }
      throw new Error('Unexpected fixture request.');
    });
    const bucket = R2.Service.create({ accountId, credentials }).bucket('assets');
    using files = Files.Client.local(R2.Files.create({ bucket, policy }));
    const error = await expectError(() => files.cmd.send('files:read', { path: 'dist.json' }));
    expect(error.cause).to.eql({
      name: 'FilesR2Error.NotFound',
      message: 'File not found: dist.json',
    });
    expect(R2.Error.diagnostic(error)).to.eql(undefined);
  });

  for (const denied of [false, true]) {
    it(`body consumption failure (runtime denial: ${denied}) → safe detail survives Files/Cmd`, async () => {
      using _mock = WebFixture.Fetch.mock((input, init) => {
        const req = new Request(input, init);
        if (req.method === 'HEAD') {
          return Promise.resolve(
            new Response(null, {
              headers: { 'content-length': '2', 'content-type': 'application/json' },
            }),
          );
        }
        if (req.method === 'GET' && new URL(req.url).searchParams.has('list-type')) {
          return Promise.resolve(
            new Response(
              '<ListBucketResult><IsTruncated>false</IsTruncated></ListBucketResult>',
            ),
          );
        }
        if (req.method !== 'GET') throw new Error('Unexpected fixture request.');
        return Promise.resolve(
          new Response(
            new ReadableStream({
              start(controller) {
                controller.error(
                  denied
                    ? new Deno.errors.NotCapable('fixture-secret body failure')
                    : new Error('fixture-secret body failure'),
                );
              },
            }),
          ),
        );
      });
      const bucket = R2.Service.create({ accountId, credentials }).bucket('assets');
      using files = Files.Client.local(R2.Files.create({ bucket, policy }));
      const error = await expectError(() => files.cmd.send('files:read', { path: 'dist.json' }));
      expect(R2.Error.diagnostic(error)).to.eql(denied ? undefined : { operation: 'read' });
      expect(R2.Error.permission(error)?.name).to.eql(denied ? 'NotCapable' : undefined);
      expect(Err.summary(error, { cause: true })).not.to.include('fixture-secret');
    });
  }

  it('unrecognized code and private fields → only the operation and valid HTTP status survive', () => {
    const error = requestFailure('write', {
      name: 'ProviderError',
      statusCode: 401,
      code: 'secret-code https://signed.invalid/',
      message: 'private message',
      headers: { authorization: 'private authorization' },
    });
    expect(error.message).to.eql('R2 write failed: HTTP 401.');
    expect(error.cause).to.eql({
      name: 'R2RequestError',
      message: 'R2 write failed: HTTP 401.',
      data: { operation: 'write', status: 401 },
    });
    for (const statusCode of ['403', NaN, Infinity, 99, 600, 403.5]) {
      expect(R2.Error.diagnostic(requestFailure('read', { statusCode })))
        .to.eql({ operation: 'read' });
    }
  });

  it('wrapped or cyclic diagnostics → bounded lookup and fresh, revalidated formatting', () => {
    const data = {
      operation: 'remove',
      status: 503,
      code: 'ServiceUnavailable',
      secret: 'private',
    };
    const source = { name: 'R2RequestError', message: 'private message', data };
    const wrapper: { cause?: unknown; error?: unknown } = { error: source };
    wrapper.cause = wrapper;
    const detail = R2.Error.diagnostic(wrapper);
    data.operation = 'private operation';
    expect(detail).to.eql({ operation: 'remove', status: 503, code: 'ServiceUnavailable' });
    expect(R2.Error.diagnostic(wrapper)).to.eql(undefined);
    // @ts-expect-error Deliberate invalid operation at the public runtime boundary.
    expect(R2.Error.format({ operation: 'private operation' })).to.eql('R2 request failed.');
  });

  it('runtime denial → named refusal survives Files/Cmd without the private source message', async () => {
    using _mock = WebFixture.Fetch.mock(() => {
      throw new Deno.errors.NotCapable('fixture-only private runtime context');
    });
    const bucket = R2.Service.create({ accountId, credentials }).bucket('assets');
    using files = Files.Client.local(R2.Files.create({ bucket, policy }));
    const error = await expectError(() => files.writeBytes('index.html', new Uint8Array([1])));
    const denial = R2.Error.permission(error);
    expect(denial?.name).to.eql('NotCapable');
    expect(denial?.message).to.eql('R2 operation blocked by runtime permissions.');
    expect(R2.Error.diagnostic(error)).to.eql(undefined);
    expect(Err.summary(error, { cause: true })).not.to.include('fixture-only');
  });
});
