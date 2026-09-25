import { Deploy, type DeployTool } from '@sys/tools/deploy';
import { describe, expect, expectError, Fs, it, Pkg, Str, WebFixture } from '../-test.ts';
import { DIST_BATCH_LIMITS, DIST_LIMITS } from '../m.deployment/mod.ts';
import { pushSample } from '../../-scripts/task.push.ts';
import { runTask } from '../../-scripts/u.task.ts';
import { localFixture } from '../../-scripts/-test/u.fixture.ts';

const audiences = ['public', 'private'] as const;

describe('R2 deployment sample: publication wiring', () => {
  it('task declarations → next step runs only after both audience pushes succeed', async () => {
    const path = Fs.Path.fromFileUrl(new URL('../../deno.json', import.meta.url));
    const { data } = await Fs.readJson<{ tasks: Record<string, string> }>(path);
    expect(data?.tasks).to.include({
      push: 'deno task push:public && deno task push:private && deno task push:next',
      'push:public': 'deno run --no-prompt -P=push ./-scripts/task.push.ts public',
      'push:private': 'deno run --no-prompt -P=push ./-scripts/task.push.ts private',
      'push:next': 'deno run --no-prompt -P=push ./-scripts/task.push.next.ts',
    });
  });

  it('each operation publishes exactly its projection and namespace, with credential references only', async () => {
    for (const audience of audiences) {
      await using f = await fixture();
      const { config } = f;
      const before = await Fs.readText(f.dir.join(`dist.${audience}/dist.json`));
      const result = await pushSample(audience, f.dir.absolute, f.publish);
      const target = config.targets[audience];
      const names = config.credentials[audience === 'private' ? 'pushPrivate' : 'pushPublic'];
      expect(result).to.eql(f.result);
      expect(f.calls).to.eql([{
        cwd: f.dir.absolute,
        document: {
          provider: {
            kind: 'r2',
            accountId: config.accountId,
            ...target,
            credentials: {
              accessKeyId: `\${env:${names.accessKeyId}}`,
              secretAccessKey: `\${env:${names.secretAccessKey}}`,
            },
          },
          staging: { dir: `./dist.${audience}` },
          mappings: [],
        },
      }]);
      expect((await Fs.readText(f.dir.join(`dist.${audience}/dist.json`))).data).to.eql(
        before.data,
      );
    }
  });
});

describe('R2 deployment sample: publication admission', () => {
  it('either projection changes → neither audience may publish', async () => {
    for (const audience of audiences) {
      for (const changed of audiences) {
        await using f = await fixture();
        const file = changed === 'private' ? 'index.html' : 'app.js';
        await Fs.write(f.dir.join(`dist.${changed}`, file), 'changed', { throw: true });
        await expectError(() => pushSample(audience, f.dir.absolute, f.publish), 'Dist refused:');
        expect(f.calls, `publishing ${audience} with changed ${changed} bytes`).to.eql([]);
      }
    }
  });

  it('checksum-valid forbidden filenames in either projection → neither audience may publish', async () => {
    for (const invalid of audiences) {
      await using f = await fixture();
      const dir = f.dir.join(`dist.${invalid}`);
      await Fs.write(Fs.join(dir, 'sw.js'), 'fixture worker', { throw: true });
      const computed = await Pkg.Dist.compute({ dir, save: true });
      const selection = {
        pins: {
          ...f.buildRecord.selection.pins,
          [invalid]: { 'dist.json': computed.manifest.integrity },
        },
      };
      await Fs.writeJson(f.dir.join('dist.pins.json'), { ...f.buildRecord, selection }, {
        throw: true,
      });
      // Establish integrity independently: refusal must come from sample policy, not stale pins.
      const verified = await Pkg.Dist.Pins.verify({
        root: f.dir.absolute,
        selection,
        dirs: { private: 'dist.private', public: 'dist.public' },
        limits: DIST_LIMITS,
        batch: DIST_BATCH_LIMITS,
      });
      expect(verified.kind, invalid).to.eql('verified');
      for (const audience of audiences) {
        await expectError(
          () => pushSample(audience, f.dir.absolute, f.publish),
          `Invalid sample ${invalid} manifest filenames.`,
        );
        expect(f.calls, `publishing ${audience} with forbidden ${invalid} filenames`).to.eql([]);
      }
    }
  });

  it('different manifest pins or missing partner output → no automatic repin or one-target fallback', async () => {
    for (const audience of audiences) {
      await using f = await fixture();
      await Fs.writeJson(f.dir.join('dist.pins.json'), {
        ...f.buildRecord,
        selection: {
          pins: {
            ...f.buildRecord.selection.pins,
            [audience]: { 'dist.json': `sha256-${'0'.repeat(64)}` },
          },
        },
      }, { throw: true });
      await expectError(() => pushSample(audience, f.dir.absolute, f.publish), 'Dist refused:');
      expect(f.calls).to.eql([]);
      await Fs.writeJson(f.dir.join('dist.pins.json'), f.buildRecord, { throw: true });
      await Fs.remove(f.dir.join(`dist.${audience === 'private' ? 'public' : 'private'}`));
      await expectError(
        () => pushSample(audience, f.dir.absolute, f.publish),
        'Dist refused: missing.',
      );
      expect(f.calls).to.eql([]);
    }
  });

  it('partial selection, inventory fields, or changed public base → refusal before publication', async () => {
    for (const audience of audiences) {
      await using f = await fixture();
      const variants = [
        {
          ...f.buildRecord,
          selection: { pins: { private: f.buildRecord.selection.pins.private } },
        },
        { ...f.buildRecord, files: ['index.html', 'dist.json'] },
        { ...f.buildRecord, publicAssetBase: 'https://other.example.test/sample/ui/' },
      ];
      for (const selection of variants) {
        await Fs.writeJson(f.dir.join('dist.pins.json'), selection, { throw: true });
        await expectError(() => pushSample(audience, f.dir.absolute, f.publish));
        expect(f.calls).to.eql([]);
      }
    }
  });

  it('original build directory absent → verified projections remain publishable', async () => {
    await using f = await fixture();
    await Fs.remove(f.dir.join('dist'));
    await pushSample('public', f.dir.absolute, f.publish);
    expect(f.calls.length).to.eql(1);
  });

  it('selection absent → a legacy pin is not a fallback', async () => {
    await using f = await fixture();
    await Fs.writeJson(f.dir.join('dist.pin.json'), f.buildRecord.selection.pins.private, {
      throw: true,
    });
    await Fs.writeJson(f.dir.join('dist.selection.json'), f.buildRecord, { throw: true });
    await Fs.remove(f.dir.join('dist.pins.json'));
    await expectError(
      () => pushSample('private', f.dir.absolute, f.publish),
      'Run deno task build',
    );
    expect(f.calls).to.eql([]);
  });

  it('does not require a writable temporary configuration directory', async () => {
    await using f = await fixture();
    const path = f.dir.join('.tmp');
    const sentinel = 'unrelated file occupying the old temporary directory path';
    await Fs.write(path, sentinel, { throw: true });
    await pushSample('private', f.dir.absolute, f.publish);
    expect(f.calls.length).to.eql(1);
    expect((await Fs.readText(path)).data).to.eql(sentinel);
  });
});

describe('R2 deployment sample: publication failures', () => {
  it('mocked S3 refusal → safe diagnostic, no fallback writes, and no retry', async () => {
    await using f = await fixture();
    const names = f.config.credentials.pushPrivate;
    await Fs.write(
      f.dir.join('.env'),
      Str.dedent(`
        ${names.accessKeyId}=fixture-access-key
        ${names.secretAccessKey}=fixture-secret-key
      `),
      { throw: true },
    );
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
    const error = await expectError(() => pushSample('private', f.dir.absolute));
    expect(error.message).to.eql(
      'R2 stat failed: HTTP 403, AccessDenied. No automatic retry or cleanup was performed.',
    );
    expect(error.cause).to.eql(undefined);
    const logs: string[] = [];
    const code = await runTask(
      'push:private',
      () => Promise.reject(error),
      (text) => logs.push(text),
    );
    expect(code).to.eql(1);
    expect(logs.length).to.eql(1);
    expect(logs[0]).to.include('R2 stat failed: HTTP 403, AccessDenied.');
    expect(logs[0]).not.to.include('fixture-secret');
    expect(logs[0]).not.to.include('signed.invalid');
    expect(methods).to.eql(['HEAD']);
  });

  it('forged admission metadata → redacted failure, never setup advice', async () => {
    for (const audience of audiences) {
      await using f = await fixture();
      const names = f.config.credentials[audience === 'public' ? 'pushPublic' : 'pushPrivate'];
      const missingEnv = [names.secretAccessKey];
      const error = await expectError(() =>
        pushSample(audience, f.dir.absolute, () => {
          throw new Error('raw fixture diagnostic must not escape', {
            cause: { ok: false, source: 'document', reason: 'yaml-invalid', missingEnv },
          });
        })
      );
      expect(error.name).to.eql('Error');
      expect(error.message).to.eql(
        'Sample R2 push failed. No automatic retry or cleanup was performed.',
      );
      expect(error.cause).to.eql(undefined);
    }
  });

  it('real Deploy admission → blank fixture credentials become safe setup diagnostics', async () => {
    for (const audience of audiences) {
      await using f = await fixture();
      const names = f.config.credentials[audience === 'public' ? 'pushPublic' : 'pushPrivate'];
      // Both entries shadow process values; no real credentials or provider access are involved.
      await Fs.write(
        f.dir.join('.env'),
        Str.dedent(`
          ${names.accessKeyId}=present-fixture-value
          ${names.secretAccessKey}=""
        `),
        { throw: true },
      );
      const error = await expectError(() => pushSample(audience, f.dir.absolute));
      expect(error).to.deep.include({
        name: 'SampleMissingCredentials',
        missingEnv: [names.secretAccessKey],
      });
      expect(error.message).not.to.include('present-fixture-value');
      expect(error.cause).to.eql(undefined);
    }
  });

  it('recognized Deploy error with a replaced cause → captured facts win over compatibility traversal', async () => {
    await using f = await fixture();
    const names = f.config.credentials.pushPrivate;
    const dotenv = Str.dedent(`
      ${names.accessKeyId}=""
      ${names.secretAccessKey}=""
    `);
    await Fs.write(f.dir.join('.env'), dotenv, { throw: true });
    let observed: unknown;
    const error = await expectError(() =>
      pushSample('private', f.dir.absolute, async (args) => {
        try {
          return await Deploy.push(args);
        } catch (cause) {
          observed = cause;
          Object.defineProperty(cause, 'cause', {
            value: { error: new Deno.errors.NotCapable('later unrelated denial') },
          });
          throw cause;
        }
      })
    );
    expect(Deploy.Error.diagnostic(observed)?.reason).to.eql('yaml-invalid');
    expect(Deploy.Error.permission(observed)).to.eql(undefined);
    expect(error.name).to.eql('SampleMissingCredentials');
    expect(error.message).to.eql(
      `Sample credentials are missing: ${names.accessKeyId}, ${names.secretAccessKey}.`,
    );
    const logs: string[] = [];
    const code = await runTask(
      'push:private',
      () => Promise.reject(error),
      (text) => logs.push(text),
    );
    expect(code).to.eql(1);
    expect(logs).to.have.length(1);
    expect(logs[0]).to.include(names.accessKeyId);
    expect(logs[0]).not.to.include('unrelated denial');
    const otherAudience = await expectError(() =>
      pushSample('public', f.dir.absolute, () => Promise.reject(observed))
    );
    expect(otherAudience.message).to.eql(
      'Sample R2 push failed. No automatic retry or cleanup was performed.',
    );
    expect(otherAudience.cause).to.eql(undefined);
  });

  it('provider metadata or unconfigured names → ordinary redacted failure, not setup advice', async () => {
    await using f = await fixture();
    const causes = [
      {
        ok: false,
        source: 'document',
        reason: 'failed',
        missingEnv: [f.config.credentials.pushPublic.accessKeyId],
      },
      {
        ok: false,
        source: 'document',
        reason: 'yaml-invalid',
        missingEnv: ['UNRELATED_SECRET_VALUE'],
      },
    ];
    for (const cause of causes) {
      const error = await expectError(() =>
        pushSample('public', f.dir.absolute, () => {
          throw new Error('raw diagnostic', { cause });
        })
      );
      expect(error.name).to.eql('Error');
      expect(error.message).to.eql(
        'Sample R2 push failed. No automatic retry or cleanup was performed.',
      );
      expect(error.cause).to.eql(undefined);
    }
  });

  it('redacts provider failures and does not retry or attach raw causes', async () => {
    for (const audience of audiences) {
      await using f = await fixture();
      let calls = 0;
      const error = await expectError(() =>
        pushSample(audience, f.dir.absolute, () => {
          calls++;
          throw new Error('provider diagnostic with fixture-secret and a signed URL');
        })
      );
      expect(error.message).to.eql(
        'Sample R2 push failed. No automatic retry or cleanup was performed.',
      );
      expect(error.cause).to.eql(undefined);
      expect(calls).to.eql(1);
    }
  });

  it('leaves unrelated temporary files intact after asynchronous publisher rejection', async () => {
    await using f = await fixture();
    const path = f.dir.join('.tmp/keep.txt');
    const sentinel = 'unrelated temporary content';
    await Fs.write(path, sentinel, { throw: true });
    let calls = 0;
    const error = await expectError(() =>
      pushSample('public', f.dir.absolute, () => {
        calls++;
        return Promise.reject(new Error('fixture-secret'));
      })
    );
    expect(error.message).to.eql(
      'Sample R2 push failed. No automatic retry or cleanup was performed.',
    );
    expect(error.cause).to.eql(undefined);
    expect(calls).to.eql(1);
    expect(await Fs.exists(f.dir.join('.tmp/push.yaml'))).to.eql(false);
    expect((await Fs.readText(path)).data).to.eql(sentinel);
  });

  it('preserves synthetic permission denial inside uploader error wrappers', async () => {
    await using f = await fixture();
    const denial = new Deno.errors.NotCapable('Fixture permission denial.');
    const error = await expectError(() =>
      pushSample('private', f.dir.absolute, () => {
        throw new Error('wrapper', { cause: { error: denial } });
      })
    );
    expect(error).to.equal(denial);
    const logs: string[] = [];
    const reported = await expectError(() =>
      runTask('push:private', () => Promise.reject(error), (text) => logs.push(text))
    );
    expect(reported).to.equal(denial);
    expect(logs).to.eql([]);
  });
});

async function fixture() {
  const f = await localFixture();
  const calls: DeployTool.PushDocumentArgs[] = [];
  const result: DeployTool.PushDocumentResult = {
    ok: true,
    cwd: f.dir.absolute,
    source: 'document',
    targets: 1,
  };
  const publish = (args: DeployTool.PushDocumentArgs) => {
    calls.push(args);
    return Promise.resolve(result);
  };
  return { ...f, calls, publish, result };
}
