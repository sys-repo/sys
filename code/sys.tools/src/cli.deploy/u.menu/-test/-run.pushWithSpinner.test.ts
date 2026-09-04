import { describe, expect, FakeSpinner, it, type t } from '../../../-test.ts';
import { runPushWithSpinner } from '../run.pushWithSpinner.ts';

const target: t.PushTarget = {
  provider: {
    kind: 'r2',
    accountId: 'account-1',
    bucket: 'deploy-bucket',
    prefix: 'deploy/site',
    credentials: { accessKeyId: 'key-1', secretAccessKey: 'secret-1' },
  },
  sourceDir: '/tmp/source',
  stagingDir: '/tmp/staging',
};

describe('Deploy: runPushWithSpinner', () => {
  it('returns a failure result when push setup throws', async () => {
    const error = new Error('staging target unavailable');
    const unavailable: t.PushTarget = {
      ...target,
      get stagingDir(): t.StringDir {
        throw error;
      },
    };

    const res = await runPushWithSpinner({ cwd: '/tmp', target: unavailable });

    expect(res.ok).to.eql(false);
    if (res.ok) throw new Error('expected push failure');
    expect(res.error === error).to.eql(true);
  });

  it('returns a failure result when spinner construction throws', async () => {
    const error = new Error('spinner construction failed');
    const res = await runPushWithSpinner(
      { cwd: '/tmp', target },
      {
        spinner: () => {
          throw error;
        },
      },
    );

    expect(res.ok).to.eql(false);
    if (res.ok) throw new Error('expected push failure');
    expect(res.error === error).to.eql(true);
  });

  it('returns a failure result when spinner start throws', async () => {
    const error = new Error('spinner start failed');
    const spinner = FakeSpinner.create();
    spinner.start = () => {
      throw error;
    };
    const { create } = FakeSpinner.adapter({ spinner });

    const res = await runPushWithSpinner({ cwd: '/tmp', target }, { spinner: create });

    expect(res.ok).to.eql(false);
    if (res.ok) throw new Error('expected push failure');
    expect(res.error === error).to.eql(true);
    expect(spinner.fails).to.eql(1);
  });

  it('contains failure presentation errors', async () => {
    const providerError = new Error('provider failed');
    const spinner = FakeSpinner.create();
    spinner.fail = () => {
      throw new Error('spinner fail failed');
    };
    const { create } = FakeSpinner.adapter({ spinner });

    const res = await runPushWithSpinner(
      { cwd: '/tmp', target },
      {
        spinner: create,
        push: async () => ({ ok: false, reason: 'failed', error: providerError }),
      },
    );

    expect(res.ok).to.eql(false);
    if (res.ok) throw new Error('expected push failure');
    expect(res.error === providerError).to.eql(true);
  });

  it('keeps provider success when success presentation throws', async () => {
    const spinner = FakeSpinner.create();
    spinner.succeed = () => {
      throw new Error('spinner succeed failed');
    };
    const { create } = FakeSpinner.adapter({ spinner });

    const res = await runPushWithSpinner(
      { cwd: '/tmp', target },
      { spinner: create, push: async () => ({ ok: true }) },
    );

    expect(res.ok).to.eql(true);
  });
});
