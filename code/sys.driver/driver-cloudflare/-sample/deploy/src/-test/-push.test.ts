import type { DeployTool } from '@sys/tools/deploy';
import { describe, expect, expectError, Fs, it, Str, WebFixture } from '../-test.ts';
import { pushSample } from '../../-scripts/task.push.ts';
import { runTask } from '../../-scripts/u.task.ts';
import { localFixture } from '../../-scripts/-test/u.fixture.ts';

const audiences = ['public', 'private'] as const;

describe('R2 deployment sample: publication wiring', () => {
  it('task declarations → explicit public then private commands joined with &&', async () => {
    const path = Fs.Path.fromFileUrl(new URL('../../deno.json', import.meta.url));
    const { data } = await Fs.readJson<{ tasks: Record<string, string> }>(path);
    expect(data?.tasks).to.include({
      push: 'deno task push:public && deno task push:private',
      'push:public': 'deno run --no-prompt -P=push ./-scripts/task.push.ts public',
      'push:private': 'deno run --no-prompt -P=push ./-scripts/task.push.ts private',
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

  it('different manifest pins or missing partner output → no automatic repin or one-target fallback', async () => {
    for (const audience of audiences) {
      await using f = await fixture();
      await Fs.writeJson(f.dir.join('dist.selection.json'), {
        ...f.selection,
        [audience]: { 'dist.json': `sha256-${'0'.repeat(64)}` },
      }, { throw: true });
      await expectError(() => pushSample(audience, f.dir.absolute, f.publish), 'Dist refused:');
      expect(f.calls).to.eql([]);
      await Fs.writeJson(f.dir.join('dist.selection.json'), f.selection, { throw: true });
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
        { private: f.selection.private },
        { ...f.selection, files: ['index.html', 'dist.json'] },
        { ...f.selection, publicAssetBase: 'https://other.example.test/sample/ui/' },
      ];
      for (const selection of variants) {
        await Fs.writeJson(f.dir.join('dist.selection.json'), selection, { throw: true });
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
    await Fs.writeJson(f.dir.join('dist.pin.json'), f.selection.private, { throw: true });
    await Fs.remove(f.dir.join('dist.selection.json'));
    await expectError(() => pushSample('private', f.dir.absolute, f.publish));
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

  it('later configuration/selection edits do not retarget the admitted publication', async () => {
    await using f = await fixture();
    await pushSample('public', f.dir.absolute, async (args) => {
      await Fs.writeJson(f.dir.join('r2.config.json'), {}, { throw: true });
      await Fs.writeJson(f.dir.join('dist.selection.json'), {}, { throw: true });
      return await f.publish(args);
    });
    expect(f.calls.length).to.eql(1);
    expect(f.calls[0].document).to.deep.include({
      staging: { dir: './dist.public' },
      provider: {
        kind: 'r2',
        accountId: f.config.accountId,
        ...f.config.targets.public,
        credentials: {
          accessKeyId: `\${env:${f.config.credentials.pushPublic.accessKeyId}}`,
          secretAccessKey: `\${env:${f.config.credentials.pushPublic.secretAccessKey}}`,
        },
      },
    });
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

  it('owner-reported missing env → names-only setup error for the selected audience', async () => {
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
      expect(error).to.deep.include({ name: 'SampleMissingCredentials', missingEnv });
      expect(error.message).not.to.include('raw fixture');
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
