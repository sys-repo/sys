import {
  describe,
  expect,
  expectError,
  expectTypeOf,
  Fs,
  Is,
  it,
  Path,
  Pkg,
  Str,
  type t,
  Yaml,
} from '../../-test.ts';
import { Deploy } from '../mod.ts';
import { EndpointsFs } from '../u.endpoints/mod.ts';
import { R2Provider } from '../u.providers/mod.ts';
import { withTmpDir } from './u.fixture.ts';

describe('@sys/tools/deploy captured document push', () => {
  it('preserves file result types and distinguishes document source identity', () => {
    const file = () => Deploy.push({ config: './endpoint.yaml' });
    const document = () => Deploy.push({ document: endpoint() });
    expectTypeOf(file).toEqualTypeOf<() => Promise<t.DeployTool.PushResult>>();
    expectTypeOf(document).toEqualTypeOf<() => Promise<t.DeployTool.PushDocumentResult>>();

    // Compile-time checks only: neither ambiguous input may enter the API.
    const mixed = () => {
      // @ts-expect-error File and document authorities are mutually exclusive.
      Deploy.push({ config: './endpoint.yaml', document: endpoint() });
      // @ts-expect-error paths.config is also a file authority.
      Deploy.push({ paths: { config: './endpoint.yaml' }, document: endpoint() });
    };
    void mixed;
  });

  it('reuses file admission, target resolution, and provider results without writing a config', async () => {
    await withTmpDir(async (cwd) => {
      await stage(cwd);
      const document = endpoint();
      const config = Path.join(cwd, 'endpoint.yaml');
      await Fs.write(config, Yaml.stringify(document).data!);
      const before = await files(cwd);
      const calls: Parameters<typeof R2Provider.push>[0][] = [];
      await withProvider((args) => {
        calls.push(args);
        return Promise.resolve({
          ok: true,
          publish: { files: [{ path: 'index.html', status: 'written' }] },
          prune: { files: [{ path: 'old.js', status: 'removed' }] },
        });
      }, async () => {
        const file = await Deploy.push({ cwd, config, force: true });
        const captured = await Deploy.push({ cwd, document, force: true });
        expect(calls).to.have.length(2);
        expect(calls[1]).to.eql(calls[0]);
        expect(file.config).to.eql(config);
        expect('source' in file).to.eql(false);
        expect(captured.source).to.eql('document');
        expect('config' in captured).to.eql(false);
        expect(captured.targets).to.eql(file.targets);
        expect(captured.bytes).to.eql(file.bytes);
        expect(captured.publish).to.eql(file.publish);
        expect(captured.prune).to.eql(file.prune);
        expect(await files(cwd)).to.eql(before);
      });
    });
  });

  it('captures nested input and invocation options before asynchronous resolution', async () => {
    await withTmpDir(async (cwd) => {
      await stage(cwd);
      await Fs.ensureDir(Path.join(cwd, 'src'));
      const document = endpoint();
      document.mappings = [{ mode: 'copy', dir: { source: './src', staging: '.' } }];
      const args = { cwd, document, force: true };
      let calls = 0;
      await withProvider((input) => {
        calls += 1;
        expect(input.cwd).to.eql(cwd);
        expect(input.force).to.eql(true);
        expect(input.target.provider.bucket).to.eql('bucket-a');
        expect(input.target.provider.credentials.accessKeyId).to.eql('fixture-key');
        expect(input.target.stagingDir).to.eql(Path.join(cwd, 'stage'));
        return Promise.resolve({ ok: true });
      }, async () => {
        const pending = Deploy.push(args);
        args.cwd = '/not-the-selected-cwd';
        args.force = false;
        document.provider.bucket = 'changed';
        document.provider.credentials.accessKeyId = 'changed';
        document.staging.dir = './missing';
        document.mappings[0].dir.source = './missing';
        await pending;
        expect(calls).to.eql(1);
      });
    });
  });

  it('keeps concurrent calls with distinct targets independent', async () => {
    await withTmpDir(async (cwd) => {
      await stage(cwd);
      const before = await files(cwd);
      const seen: string[] = [];
      const both = Promise.withResolvers<void>();
      await withProvider(async ({ target }) => {
        seen.push(target.provider.bucket);
        if (seen.length === 2) both.resolve();
        await both.promise;
        return { ok: true };
      }, async () => {
        const a = endpoint('bucket-a');
        const b = endpoint('bucket-b');
        const first = Deploy.push({ cwd, document: a });
        const second = Deploy.push({ cwd, document: b });
        a.provider.bucket = 'mutated-a';
        b.provider.bucket = 'mutated-b';
        const results = await Promise.all([first, second]);
        expect(seen.sort()).to.eql(['bucket-a', 'bucket-b']);
        expect(results.map((item) => item.source)).to.eql(['document', 'document']);
        expect(await files(cwd)).to.eql(before);
      });
    });
  });

  it('credential refs → owner resolution without changing caller inputs or adding files', async () => {
    await withTmpDir(async (cwd) => {
      await stage(cwd);
      const document = endpoint();
      document.provider.credentials.accessKeyId = '${env:DEPLOY_CAPTURE_KEY}';
      const env = 'DEPLOY_CAPTURE_KEY="resolved-fixture-key"\n';
      await Fs.write(Path.join(cwd, '.env'), env);
      const before = await files(cwd);
      await withProvider(({ target }) => {
        expect(target.provider.credentials.accessKeyId).to.eql('resolved-fixture-key');
        return Promise.resolve({ ok: true });
      }, () => Deploy.push({ cwd, document }));
      expect(document.provider.credentials.accessKeyId).to.eql('${env:DEPLOY_CAPTURE_KEY}');
      expect(await files(cwd)).to.eql(before);
      expect((await Fs.readText(Path.join(cwd, '.env'))).data).to.eql(env);
    });
  });

  describe('unavailable environment references', () => {
    const key = 'DEPLOY_DIAGNOSTIC_KEY';
    const secret = 'DEPLOY_DIAGNOSTIC_SECRET';
    const cases = [
      { name: 'absent pair', env: '', missing: [key, secret] },
      {
        name: 'commented pair',
        env: Str.dedent(`
          # ${key}=unused
          # ${secret}=unused
        `),
        missing: [key, secret],
      },
      { name: 'partial pair', env: `${key}=present-fixture-value`, missing: [secret] },
      {
        name: 'blank pair',
        env: Str.dedent(`
          ${key}=""
          ${secret}=" \t "
        `),
        missing: [key, secret],
      },
    ];
    for (const item of cases) {
      it(`${item.name} → deduplicated names and no provider calls, for file or document input`, async () => {
        const before = [Deno.env.get(key), Deno.env.get(secret)];
        try {
          Deno.env.delete(key);
          Deno.env.delete(secret);
          await withTmpDir(async (cwd) => {
            await Fs.write(Path.join(cwd, '.env'), item.env, { throw: true });
            const document = endpoint();
            // The same unavailable name in two fields must appear only once in diagnostics.
            document.provider.accountId = `\${env:${key}}`;
            document.provider.credentials = {
              accessKeyId: `\${env:${key}}`,
              secretAccessKey: `\${env:${secret}}`,
            };
            const config = Path.join(cwd, 'endpoint.yaml');
            await Fs.write(config, Yaml.stringify(document).data!, { throw: true });
            let calls = 0;
            await withProvider(() => {
              calls++;
              return Promise.resolve({ ok: true });
            }, async () => {
              for (const input of [{ cwd, document }, { cwd, config }]) {
                const error = await expectError(() => Deploy.push(input));
                expect(error.cause).to.deep.include({
                  ok: false,
                  reason: 'yaml-invalid',
                  missingEnv: item.missing,
                });
                const detail = Deploy.Error.diagnostic(error);
                expect(detail).to.eql({ reason: 'yaml-invalid', missingEnv: item.missing });
                expect(Object.isFrozen(detail)).to.eql(true);
                expect(Object.isFrozen(detail?.missingEnv)).to.eql(true);
                expect(Deploy.Error.permission(error)).to.eql(undefined);

                // Mutating the detailed cause must not change the captured facts.
                const cause = error.cause;
                if (!Is.record(cause)) throw new Error('Expected admission cause.');
                expect(detail?.missingEnv).not.to.equal(cause.missingEnv);
                cause.missingEnv = ['FORGED_NAME'];
                cause.reason = 'failed';
                expect(Deploy.Error.diagnostic(error)).to.equal(detail);
                expect(detail?.missingEnv).to.eql(item.missing);
                expect(String(error)).not.to.include('present-fixture-value');
              }
              expect(calls).to.eql(0);
            });
          });
        } finally {
          if (before[0] === undefined) Deno.env.delete(key);
          else Deno.env.set(key, before[0]);
          if (before[1] === undefined) Deno.env.delete(secret);
          else Deno.env.set(secret, before[1]);
        }
      });
    }
  });

  it('refuses mixed sources before admission or provider work', async () => {
    await withTmpDir(async (cwd) => {
      const before = await files(cwd);
      const original = EndpointsFs.validateDocument;
      let admissions = 0;
      const fs = EndpointsFs as { validateDocument: typeof original };
      fs.validateDocument = () => {
        admissions += 1;
        return Promise.reject(new Error('must not admit'));
      };
      try {
        await withProvider(() => {
          return Promise.reject(new Error('must not publish'));
        }, async () => {
          const refs = [{ config: './missing.yaml' }, { paths: { config: './missing.yaml' } }];
          for (const ref of refs) {
            const document = endpoint();
            document.provider.credentials.accessKeyId = '${env:DEPLOY_CAPTURE_KEY}';
            const input = { cwd, document, ...ref } as unknown as t.DeployTool.PushArgs;
            const error = await expectError(() => Deploy.push(input));
            expect(error.message).to.include(
              'document and config references are mutually exclusive',
            );
          }
        });
        expect(admissions).to.eql(0);
        expect(await files(cwd)).to.eql(before);
      } finally {
        fs.validateDocument = original;
      }
    });
  });

  it('preserves validation parity for schema, paths, missing sources, and malformed refs', async () => {
    await withTmpDir(async (cwd) => {
      const cases = [
        { ...endpoint(), extra: true },
        { ...endpoint(), staging: { dir: '../escape' } },
        { ...endpoint(), mappings: [{ mode: 'copy', dir: { source: './missing', staging: '.' } }] },
        { ...endpoint(), staging: { dir: 'prefix-${env:INVALID_REF}' } },
      ];
      let calls = 0;
      await withProvider(() => {
        calls += 1;
        return Promise.resolve({ ok: true });
      }, async () => {
        for (const document of cases) {
          const config = Path.join(cwd, 'invalid.yaml');
          await Fs.write(config, Yaml.stringify(document).data!);
          const file = await expectError(() => Deploy.push({ cwd, config }));
          const input = { cwd, document } as t.DeployTool.PushDocumentArgs;
          const captured = await expectError(() => Deploy.push(input));
          const fileFailure = file.cause;
          const documentFailure = captured.cause;
          if (!Is.record(fileFailure) || !Is.record(documentFailure)) {
            throw new Error('Expected structured admission failures.');
          }
          expect(fileFailure.reason).to.eql('yaml-invalid');
          expect(documentFailure.reason).to.eql(fileFailure.reason);
          expect(Deploy.Error.diagnostic(file)).to.eql({ reason: 'yaml-invalid' });
          expect(Deploy.Error.diagnostic(captured)).to.eql({ reason: 'yaml-invalid' });
          expect(documentFailure.source).to.eql('document');
          expect('config' in documentFailure).to.eql(false);

          // Validation messages match after the source-specific first line.
          const fileDetails = String(fileFailure.error).split('\n').slice(1);
          const documentDetails = String(documentFailure.error).split('\n').slice(1);
          expect(documentDetails).to.eql(fileDetails);
        }
        expect(calls).to.eql(0);
      });
    });
  });

  it('preserves permission-denial identity thrown by shared admission', async () => {
    await withTmpDir(async (cwd) => {
      const document = endpoint();
      const config = Path.join(cwd, 'endpoint.yaml');
      await Fs.write(config, Yaml.stringify(document).data!);
      const before = await files(cwd);
      const original = EndpointsFs.validateAst;
      const fs = EndpointsFs as { validateAst: typeof original };
      const denial = new Deno.errors.NotCapable('fixture admission denial');
      // An unreadable cause must not prevent independent permission capture.
      Object.defineProperty(denial, 'cause', {
        get() {
          throw new Error('unreadable cause');
        },
      });
      fs.validateAst = () => Promise.reject(denial);
      try {
        const first = await expectError(() => Deploy.push({ cwd, document }));
        expect(first).to.equal(denial);
        const detail = Deploy.Error.diagnostic(denial);
        expect(detail).to.eql({ reason: 'failed' });
        expect(Object.isFrozen(detail)).to.eql(true);
        expect(Deploy.Error.permission(denial)).to.equal(denial);

        // Reuse across overloads and concurrent calls must preserve the first observation.
        const reused = await Promise.all([
          expectError(() => Deploy.push({ cwd, config })),
          expectError(() => Deploy.push({ cwd, document })),
        ]);
        expect(reused.every((error) => error === denial)).to.eql(true);
        expect(Deploy.Error.diagnostic(denial)).to.equal(detail);
        expect(Deploy.Error.permission(denial)).to.equal(denial);
        expect(await files(cwd)).to.eql(before);
      } finally {
        fs.validateAst = original;
      }
    });
  });

  it('retains provider failure semantics and source identity without leaving a config', async () => {
    await withTmpDir(async (cwd) => {
      await stage(cwd);
      const before = await files(cwd);
      const providerError = new Error('fixture provider failure');
      for (const rejects of [false, true]) {
        await withProvider(() => {
          if (rejects) return Promise.reject(providerError);
          return Promise.resolve({
            ok: false,
            reason: 'failed',
            hint: 'fixture down',
            error: providerError,
          });
        }, async () => {
          const error = await expectError(() => Deploy.push({ cwd, document: endpoint() }));
          const cause = error.cause;
          if (!Is.record(cause)) throw new Error('Expected a structured provider failure.');
          expect(cause).to.deep.include({ reason: 'failed', source: 'document' });
          expect(cause.error).to.equal(providerError);
          expect(cause.target).to.include({ bucket: 'bucket-a' });
          expect(cause).not.to.have.property('config');
          expect(await files(cwd)).to.eql(before);
        });
      }
    });
  });
});

function endpoint(bucket = 'bucket-a') {
  return {
    provider: {
      kind: 'r2' as const,
      accountId: 'fixture-account',
      bucket,
      prefix: 'fixture/publish',
      credentials: { accessKeyId: 'fixture-key', secretAccessKey: 'fixture-secret' },
    },
    staging: { dir: './stage' },
    mappings: [] as t.DeployTool.Config.EndpointYaml.Mapping[],
  } satisfies t.DeployTool.Config.EndpointYaml.Doc;
}

async function stage(cwd: string): Promise<void> {
  const dir = Path.join(cwd, 'stage');
  await Fs.write(Path.join(dir, 'index.html'), '<!doctype html>fixture');
  await Pkg.Dist.compute({ dir, save: true });
}

async function files(cwd: string): Promise<readonly string[]> {
  const entries = await Fs.glob(cwd, { includeDirs: false }).find('**/*');
  return entries.map((entry) => entry.path).sort();
}

async function withProvider<T>(push: typeof R2Provider.push, fn: () => Promise<T>): Promise<T> {
  const provider = R2Provider as { push: typeof R2Provider.push };
  const original = provider.push;
  provider.push = push;
  try {
    return await fn();
  } finally {
    provider.push = original;
  }
}
