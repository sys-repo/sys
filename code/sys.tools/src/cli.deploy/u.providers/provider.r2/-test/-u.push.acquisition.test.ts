import { describe, expect, it, WebFixture } from '../../../../-test.ts';
import { Err, Files, R2, type t } from '../../common.ts';
import { withTmpDir } from '../../../-test/u.fixture.ts';
import { R2Provider } from '../mod.ts';
import { filesHandle, r2Target, stageDist, type Write } from './u.fixture.ts';

describe('R2 Provider: acquisition', () => {
  it('unclassified read rejection → no publication or pruning, original error, dispose once', async () => {
    await withTmpDir(async (cwd) => {
      const stagingDir = await stageDist(cwd);
      const writes: Write[] = [];
      const base = filesHandle({ writes });
      const failure = new Error('remote dist unavailable');
      let disposed = 0;
      let listed = 0;
      const result = await R2Provider.push({
        cwd,
        target: r2Target(cwd, stagingDir),
        createFiles: () => ({
          ...base,
          cmd: { ...base.cmd, send: () => Promise.reject(failure) },
          list() {
            listed++;
            return Promise.resolve({ entries: [] });
          },
          dispose() {
            disposed++;
          },
        }),
      });
      expect(writes).to.eql([]);
      expect(listed).to.eql(0);
      expect(disposed).to.eql(1);
      expect(result.ok).to.eql(false);
      if (result.ok) throw new Error('Expected acquisition refusal.');
      expect(result.error).to.equal(failure);
    });
  });

  for (const mode of ['body', 'enumeration', 'ref', 'invalid-utf8-inline'] as const) {
    it(`${mode} acquisition failure through Files/Cmd → zero PUT/DELETE and one disposal`, async () => {
      await sdkPush(mode, ({ result, methods, disposed }) => {
        expect(methods.filter((method) => method === 'PUT' || method === 'DELETE')).to.eql([]);
        expect(disposed).to.eql(1);
        expect(result.ok).to.eql(false);
        if (result.ok) throw new Error('Expected acquisition refusal.');
        if (mode === 'body') {
          expect(R2.Error.diagnostic(result.error)).to.eql({ operation: 'read' });
          expect(Err.summary(result.error, { cause: true })).not.to.include('fixture-secret');
        }
        if (mode === 'enumeration') {
          expect(Err.summary(result.error)).to.include('enumeration limit exceeded');
          expect(methods).to.eql(['HEAD', 'GET']);
        }
        if (mode === 'invalid-utf8-inline') {
          expect(Err.summary(result.error)).to.include('Unsupported UTF-8 read content: dist.json');
          expect(R2.Error.diagnostic(result.error)).to.eql(undefined);
          expect(methods).to.eql(['HEAD', 'GET', 'GET']);
        }
      });
    });
  }

  for (const mode of ['absent', 'malformed', 'invalid-utf8-ref'] as const) {
    it(`${mode} manifest through Files/Cmd → cold-start publication remains available`, async () => {
      await sdkPush(mode, ({ result, methods, disposed }) => {
        expect(result.ok).to.eql(true);
        expect(methods.filter((method) => method === 'PUT')).to.have.length(3);
        expect(methods.filter((method) => method === 'DELETE')).to.eql([]);
        expect(disposed).to.eql(1);
      });
    });
  }
});

type Mode =
  | 'body'
  | 'enumeration'
  | 'ref'
  | 'absent'
  | 'malformed'
  | 'invalid-utf8-ref'
  | 'invalid-utf8-inline';

/** Real publisher, Files/Cmd, and S3 client; all requests terminate at this synthetic fixture. */
async function sdkPush(
  mode: Mode,
  check: (evidence: {
    readonly result: Awaited<ReturnType<typeof R2Provider.push>>;
    readonly methods: readonly string[];
    readonly disposed: number;
  }) => void,
) {
  await withTmpDir(async (cwd) => {
    const stagingDir = await stageDist(cwd);
    const input = r2Target(cwd, stagingDir);
    const provider = { ...input.provider, accountId: '0123456789abcdef0123456789abcdef' };
    const target = { ...input, provider };
    const origin = R2.Service.storageUrl(provider.accountId);
    const methods: string[] = [];
    let disposed = 0;
    using _mock = WebFixture.Fetch.mock((input, init) => {
      const req = new Request(input, init);
      const url = new URL(req.url);
      methods.push(req.method);
      if (url.origin === provider.readOrigin) {
        if (mode === 'ref') return Promise.resolve(new Response('Unavailable', { status: 503 }));
        if (mode === 'invalid-utf8-ref') {
          return Promise.resolve(new Response(new Uint8Array([255, 255])));
        }
      }
      if (url.origin !== origin) throw new Error('Unexpected fixture origin.');
      if (req.method === 'HEAD') {
        if (mode === 'absent') return Promise.resolve(new Response(null, { status: 404 }));
        return Promise.resolve(
          new Response(null, {
            headers: {
              'content-length': '2',
              'content-type': 'application/json',
              etag: '"fixture"',
            },
          }),
        );
      }
      if (req.method === 'GET' && url.searchParams.has('list-type')) {
        const more = mode === 'enumeration' &&
          url.searchParams.get('prefix') === `${provider.prefix}/dist.json/`;
        return Promise.resolve(
          new Response(
            `<ListBucketResult><IsTruncated>${more}</IsTruncated>` +
              (more ? '<NextContinuationToken>again</NextContinuationToken>' : '') +
              '</ListBucketResult>',
          ),
        );
      }
      if (req.method === 'GET' && url.pathname.endsWith('/dist.json')) {
        const body = mode === 'body'
          ? new ReadableStream<Uint8Array>({
            start(controller) {
              controller.error(new Error('fixture-secret body failure'));
            },
          })
          : mode === 'invalid-utf8-inline'
          ? new Uint8Array([255, 255])
          : '{}';
        return Promise.resolve(new Response(body));
      }
      if (req.method === 'PUT') {
        return Promise.resolve(new Response(null, { headers: { etag: '"fixture"' } }));
      }
      if (req.method === 'DELETE') return Promise.resolve(new Response(null, { status: 204 }));
      throw new Error('Unexpected fixture request.');
    });
    const result = await R2Provider.push({
      cwd,
      target,
      createFiles() {
        const bucket = R2.Service.create({
          accountId: provider.accountId,
          credentials: provider.credentials,
        }).bucket(provider.bucket, {
          readOrigin: mode === 'ref' || mode === 'invalid-utf8-ref'
            ? provider.readOrigin
            : undefined,
        });
        const enumeration: t.R2.Files.EnumerationLimits = {
          maxRequests: 1,
          maxObjects: 100,
          maxKeyBytes: 1024,
          maxEntries: 100,
          maxPathBytes: 1024,
        };
        const files = Files.Client.local(R2.Files.create({
          bucket,
          prefix: provider.prefix,
          enumeration,
          policy: { list: '**', stat: '**', read: '**', write: '**', remove: '**', manifest: true },
        }));
        return {
          ...files,
          dispose() {
            disposed++;
            files.dispose();
          },
        };
      },
    });
    check({ result, methods, disposed });
  });
}
