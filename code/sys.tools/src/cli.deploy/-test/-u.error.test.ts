import {
  describe,
  expect,
  expectError,
  expectTypeOf,
  Fs,
  it,
  type t,
  WebFixture,
  Yaml,
} from '../../-test.ts';
import { Deploy } from '../mod.ts';
import { EndpointsFs } from '../u.endpoints/mod.ts';
import { R2Provider } from '../u.providers/mod.ts';
import { r2Provider, stageDist } from '../u.providers/provider.r2/-test/u.fixture.ts';
import { withTmpDir } from './u.fixture.ts';

describe('@sys/tools/deploy failure observations', () => {
  it('unknown and forged identities → no recognition or property access', () => {
    const forged = new Error('forged', {
      cause: { ok: false, reason: 'yaml-invalid', missingEnv: ['FORGED_NAME'] },
    });
    const proxy = new Proxy({}, {
      get() {
        throw new Error('Must not inspect unknown errors.');
      },
      getPrototypeOf() {
        throw new Error('Must not inspect unknown prototypes.');
      },
    });
    const denial = new Deno.errors.NotCapable();
    const unknowns = [undefined, null, false, 0, '', {}, forged, proxy, denial];
    for (const error of unknowns) {
      expect(Deploy.Error.diagnostic(error)).to.eql(undefined);
      expect(Deploy.Error.permission(error)).to.eql(undefined);
    }

    const diagnostic = Deploy.Error.diagnostic(forged);
    const permission = Deploy.Error.permission(forged);
    expectTypeOf(diagnostic).toEqualTypeOf<t.DeployTool.Error.Diagnostic | undefined>();
    expectTypeOf(permission).toEqualTypeOf<Error | undefined>();
  });

  for (const source of ['file', 'document'] as const) {
    it(`${source}: provider rejection/result → frozen facts, no advice, no mutable-cause lookup`, async () => {
      await withInput(source, async (input) => {
        for (const rejects of [true, false]) {
          const data = {
            operation: 'write',
            status: 403,
            code: 'AccessDenied',
            url: 'https://signed.invalid/?token=secret',
            headers: { secret: 'fixture-secret' },
          };
          const raw = Object.assign(new Error('fixture-secret /private/path'), {
            name: 'R2RequestError',
            data,
            missingEnv: ['PROVIDER_ADVICE'],
          });
          await withProvider(() => {
            if (rejects) return Promise.reject(raw);
            return Promise.resolve({ ok: false, reason: 'failed', error: raw });
          }, async () => {
            const error = await expectError(() => Deploy.push(input));
            const detail = Deploy.Error.diagnostic(error);
            const expected = {
              reason: 'failed',
              r2: { operation: 'write', status: 403, code: 'AccessDenied' },
            };
            expect(detail).to.eql(expected);
            expect(Object.isFrozen(detail)).to.eql(true);
            expect(Object.isFrozen(detail?.r2)).to.eql(true);
            expect(detail?.r2).not.to.equal(data);
            expect(() => Object.assign(detail!, { reason: 'yaml-invalid' })).to.throw(TypeError);
            expect(() => Object.assign(detail!.r2!, { status: 200 })).to.throw(TypeError);
            expect(Deploy.Error.permission(error)).to.eql(undefined);

            const copy = new Error(error.message, { cause: error.cause });
            const wrapper = new Error('wrapper', { cause: error });
            expect(Deploy.Error.diagnostic(raw)).to.eql(undefined);
            expect(Deploy.Error.diagnostic(copy)).to.eql(undefined);
            expect(Deploy.Error.diagnostic(wrapper)).to.eql(undefined);

            // Safe observations do not sanitize the detailed exception.
            expect(error.message).to.include('fixture-secret');
            expect(Object.keys(error)).to.eql([]);
            data.status = 200;
            data.code = 'UnknownSecretCode';
            error.cause = { error: new Deno.errors.NotCapable('late denial') };
            Object.defineProperty(raw, 'data', {
              get() {
                throw new Error('late getter');
              },
            });
            Object.defineProperty(error, 'cause', {
              get() {
                throw new Error('late cause');
              },
            });
            expect(Deploy.Error.diagnostic(error)).to.equal(detail);
            expect(detail).to.eql(expected);
            expect(Deploy.Error.permission(error)).to.eql(undefined);
          });
        }
      });
    });

    it(`${source}: nested runtime denial → captured identity, separate from safe facts`, async () => {
      await withInput(source, async (input) => {
        const denials = [
          new Deno.errors.NotCapable('fixture denial'),
          new Deno.errors.PermissionDenied('fixture denial'),
        ];
        for (const denial of denials) {
          const wrapper = new Error('provider wrapper', { cause: { error: denial } });
          await withProvider(() => Promise.reject(wrapper), async () => {
            const error = await expectError(() => Deploy.push(input));
            expect(error).not.to.equal(denial);
            expect(Deploy.Error.diagnostic(error)).to.eql({ reason: 'failed' });
            expect(Deploy.Error.permission(error)).to.equal(denial);
            expect(Deploy.Error.permission(wrapper)).to.eql(undefined);
            expect(Deploy.Error.permission(denial)).to.eql(undefined);
            wrapper.cause = new Error('replacement');
            error.cause = undefined;
            expect(Deploy.Error.permission(error)).to.equal(denial);
          });
        }
      });
    });

    it(`${source}: missing staging → category only, no paths or provider calls`, async () => {
      await withInput(source, async (input) => {
        await Fs.remove(Fs.join(input.cwd!, 'stage'));
        let calls = 0;
        await withProvider(() => {
          calls++;
          return Promise.resolve({ ok: true });
        }, async () => {
          const error = await expectError(() => Deploy.push(input));
          expect(Deploy.Error.diagnostic(error)).to.eql({ reason: 'no-staging-output' });
          expect(calls).to.eql(0);
        });
      });
    });

    it(`${source}: real R2/Files/SDK refusal → closed facts, one HEAD and no writes`, async () => {
      await withInput(source, async (input) => {
        const methods: string[] = [];
        using _mock = WebFixture.Fetch.mock((input, init) => {
          methods.push(new Request(input, init).method);
          return Promise.resolve(
            new Response(
              '<Error><Code>AccessDenied</Code><Message>fixture-secret https://signed.invalid/?token=secret</Message></Error>',
              { status: 403, headers: { 'content-type': 'application/xml' } },
            ),
          );
        });
        const error = await expectError(() => Deploy.push(input));
        expect(methods).to.eql(['HEAD']);
        expect(Deploy.Error.diagnostic(error)).to.eql({
          reason: 'failed',
          r2: { operation: 'stat', status: 403, code: 'AccessDenied' },
        });
        expect(Deploy.Error.permission(error)).to.eql(undefined);
      });
    });
  }

  it('reused provider identity → independent outer observations, including concurrent calls', async () => {
    await withInput('document', async (input) => {
      const data = { operation: 'read', status: 403, code: 'AccessDenied' };
      const raw = Object.assign(new Error('shared provider error'), {
        name: 'R2RequestError',
        data,
      });
      await withProvider(() => Promise.reject(raw), async () => {
        const first = await expectError(() => Deploy.push(input));
        const detail = Deploy.Error.diagnostic(first);
        data.status = 503;
        data.code = 'ServiceUnavailable';
        const rest = await Promise.all([
          expectError(() => Deploy.push(input)),
          expectError(() => Deploy.push(input)),
        ]);
        expect(new Set([first, ...rest]).size).to.eql(3);
        expect(detail?.r2).to.eql({ operation: 'read', status: 403, code: 'AccessDenied' });
        for (const error of rest) {
          const captured = Deploy.Error.diagnostic(error);
          expect(captured?.r2).to.eql({
            operation: 'read',
            status: 503,
            code: 'ServiceUnavailable',
          });
          expect(captured).not.to.equal(detail);
        }
        expect(Deploy.Error.diagnostic(first)).to.equal(detail);
        expect(Deploy.Error.diagnostic(raw)).to.eql(undefined);
      });
    });
  });

  it('escaping admission exception → unchanged identity and context-independent first observation', async () => {
    await withInput('document', async (input) => {
      const error = new Error('admission failed');
      const original = EndpointsFs.validateDocument;
      const fs = EndpointsFs as { validateDocument: typeof original };
      fs.validateDocument = () => Promise.reject(error);
      try {
        expect(await expectError(() => Deploy.push(input))).to.equal(error);
        const detail = Deploy.Error.diagnostic(error);
        expect(detail).to.eql({ reason: 'failed' });
        error.cause = {
          error: new Deno.errors.NotCapable('later unrelated denial'),
          missingEnv: ['FORGED'],
        };
        expect(await expectError(() => Deploy.push(input))).to.equal(error);
        expect(Deploy.Error.diagnostic(error)).to.equal(detail);
        expect(Deploy.Error.permission(error)).to.eql(undefined);
      } finally {
        fs.validateDocument = original;
      }
    });
  });

  it('unknown or unstable provider fields → no forwarding of arbitrary strings', async () => {
    await withInput('document', async (input) => {
      let statusReads = 0;
      const cases = [
        { operation: 'read', status: 999, code: 'SECRET_VALUE' },
        {
          operation: 'read',
          get status() {
            // Change after R2's three numeric checks, before it copies the status.
            return ++statusReads < 4 ? 403 : 'SECRET_VALUE';
          },
        },
      ];
      for (const data of cases) {
        const raw = Object.assign(new Error('secret'), { name: 'R2RequestError', data });
        await withProvider(() => Promise.reject(raw), async () => {
          const error = await expectError(() => Deploy.push(input));
          expect(Deploy.Error.diagnostic(error)).to.eql({
            reason: 'failed',
            r2: { operation: 'read' },
          });
        });
      }
    });
  });

  it('unreadable admission cause → classification cannot replace the escaping exception', async () => {
    await withInput('document', async (input) => {
      const error = new Error('admission failed');
      Object.defineProperty(error, 'cause', {
        get() {
          throw new Error('unreadable');
        },
      });
      const original = EndpointsFs.validateDocument;
      const fs = EndpointsFs as { validateDocument: typeof original };
      fs.validateDocument = () => Promise.reject(error);
      try {
        expect(await expectError(() => Deploy.push(input))).to.equal(error);
        expect(Deploy.Error.diagnostic(error)).to.eql({ reason: 'failed' });
        expect(Deploy.Error.permission(error)).to.eql(undefined);
      } finally {
        fs.validateDocument = original;
      }
    });
  });

  it('primitive admission rejection → unchanged and unrecognized', async () => {
    await withInput('document', async (input) => {
      const original = EndpointsFs.validateDocument;
      const fs = EndpointsFs as { validateDocument: typeof original };
      try {
        for (const reason of [undefined, null, false, 0, '']) {
          fs.validateDocument = () => Promise.reject(reason);
          const results = await Promise.allSettled([Deploy.push(input)]);
          expect(results).to.eql([{ status: 'rejected', reason }]);
          expect(Deploy.Error.diagnostic(reason)).to.eql(undefined);
          expect(Deploy.Error.permission(reason)).to.eql(undefined);
        }
      } finally {
        fs.validateDocument = original;
      }
    });
  });

  it('provider-shaped admission metadata → recognized failure without credential advice', async () => {
    await withInput('document', async (input) => {
      const raw = new Error('provider secret', {
        cause: { ok: false, reason: 'yaml-invalid', missingEnv: ['FORGED_NAME'] },
      });
      await withProvider(() => {
        return Promise.resolve({
          ok: false,
          reason: 'failed',
          missingEnv: ['PROVIDER_NAME'],
          error: raw,
        });
      }, async () => {
        const error = await expectError(() => Deploy.push(input));
        expect(Deploy.Error.diagnostic(error)).to.eql({ reason: 'failed' });
        expect(Deploy.Error.permission(error)).to.eql(undefined);
      });
    });
  });
});

async function withInput(
  source: 'file' | 'document',
  fn: (input: t.DeployTool.PushArgs) => Promise<void>,
) {
  await withTmpDir(async (cwd) => {
    await stageDist(cwd);
    const document: t.DeployTool.Config.EndpointYaml.Doc = {
      provider: { ...r2Provider(), accountId: '0123456789abcdef0123456789abcdef' },
      staging: { dir: './stage' },
      mappings: [],
    };
    const config = Fs.join(cwd, 'endpoint.yaml');
    await Fs.write(config, Yaml.stringify(document).data!, { throw: true });
    await fn(source === 'file' ? { cwd, config } : { cwd, document });
  });
}

async function withProvider(push: typeof R2Provider.push, fn: () => Promise<void>) {
  const provider = R2Provider as { push: typeof R2Provider.push };
  const original = provider.push;
  provider.push = push;
  try {
    await fn();
  } finally {
    provider.push = original;
  }
}
