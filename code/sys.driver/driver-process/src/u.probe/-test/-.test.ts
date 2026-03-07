import { describe, expect, it } from '../../-test.ts';
import { checkVersion, isMissingBinaryError } from '../mod.ts';
import { failOutput, okOutput, withInvokeStub } from './fixture.ts';

describe(`u.probe`, () => {
  it('returns ok when the probe succeeds', async () => {
    await withInvokeStub(
      async () => okOutput(),
      async () => {
        const result = await checkVersion('tool');
        expect(result.ok).to.eql(true);
      },
    );
  });

  it('returns an error when the probe fails', async () => {
    await withInvokeStub(
      async () => failOutput('broken'),
      async () => {
        const result = await checkVersion('tool');
        expect(result.ok).to.eql(false);
        if (!result.ok) expect(String(result.error)).to.contain('broken');
      },
    );
  });

  it('returns an error when Process.invoke throws', async () => {
    await withInvokeStub(
      async () => {
        throw new Error('boom');
      },
      async () => {
        const result = await checkVersion('tool');
        expect(result.ok).to.eql(false);
      },
    );
  });

  it('uses the default args when none are provided', async () => {
    await withInvokeStub(
      async (args) => {
        expect(args.args).to.eql(['-version']);
        return okOutput();
      },
      async () => {
        await checkVersion('tool');
      },
    );
  });

  it('passes custom args through to Process.invoke', async () => {
    await withInvokeStub(
      async (args) => {
        expect(args.args).to.eql(['--version']);
        return okOutput();
      },
      async () => {
        await checkVersion('tool', ['--version']);
      },
    );
  });

  it('classifies missing-binary errors accurately', () => {
    expect(isMissingBinaryError(new Error('ENOENT: no such file or directory'))).to.eql(true);
    expect(isMissingBinaryError('not found')).to.eql(true);
    expect(isMissingBinaryError('cannot find')).to.eql(true);
    expect(isMissingBinaryError('permission denied')).to.eql(false);
  });
});
