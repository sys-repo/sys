import { describe, expect, expectError, Fs, it, Str } from '../../-test.ts';
import { Deploy } from '../mod.ts';
import { captureInfo, providerlessPrebuiltStageYaml, withTmpDir } from './u.fixture.ts';

describe('@sys/tools/deploy programmatic push', () => {
  it('Deploy.push(...) rejects providerless endpoints clearly', async () => {
    await withTmpDir(async (cwd) => {
      const config = await writeProviderlessPushEndpoint(cwd);
      await expectNoProviderPush(
        () => Deploy.push({ cwd, config: './-config/@sys.tools.deploy/stage.yaml' }),
        config,
      );
    });
  });

  it('Deploy.push(...) keeps noop inert with no push targets', async () => {
    await withTmpDir(async (cwd) => {
      const config = `${cwd}/noop.yaml`;
      const yaml = Str.dedent(`
        provider:
          kind: noop
        staging:
          dir: ./stage
        mappings: []
      `);
      await Fs.write(config, yaml);

      const error = await expectError(() => Deploy.push({ cwd, config: './noop.yaml' }));
      expect(String(error)).to.include('reason: no-push-targets');
      expect(String(error)).to.include('No deploy targets resolved for this provider.');
      expect(error.cause).to.deep.include({ ok: false, reason: 'no-push-targets' });
      expect(Deploy.Error.diagnostic(error)).to.eql({ reason: 'no-push-targets' });
    });
  });

  it('Deploy.push(...) accepts owner config refs from paths.config', async () => {
    await withTmpDir(async (cwd) => {
      const config = await writeProviderlessPushEndpoint(cwd);

      await expectNoProviderPush(
        () => Deploy.push({ cwd, paths: { config: './-config/@sys.tools.deploy/stage.yaml' } }),
        config,
      );
    });
  });

  it('Deploy.push(...) accepts equivalent config refs', async () => {
    await withTmpDir(async (cwd) => {
      const config = await writeProviderlessPushEndpoint(cwd);

      await expectNoProviderPush(
        () =>
          Deploy.push({
            cwd,
            config: './-config/@sys.tools.deploy/stage.yaml',
            paths: { config },
          }),
        config,
      );
    });
  });

  it('Deploy.push(...) rejects conflicting config refs', async () => {
    await withTmpDir(async (cwd) => {
      await expectError(
        () =>
          Deploy.push({
            cwd,
            config: './a.yaml',
            paths: { config: './b.yaml' },
          }),
        'Deploy.push: config and paths.config resolve to different paths.',
      );
    });
  });
});

async function writeProviderlessPushEndpoint(cwd: string): Promise<string> {
  const config = `${cwd}/-config/@sys.tools.deploy/stage.yaml`;
  await Fs.ensureDir(`${cwd}/-config/@sys.tools.deploy`);
  await Fs.ensureDir(`${cwd}/view/.pulled/ui.components`);
  await Fs.write(
    `${cwd}/view/.pulled/ui.components/index.html`,
    '<!doctype html><html><body>source</body></html>\n',
  );
  await Fs.write(config, providerlessPrebuiltStageYaml());
  return config;
}

async function expectNoProviderPush(fn: () => Promise<unknown>, config: string): Promise<void> {
  const captured = await captureInfo(() => expectError(fn));
  const error = captured.value;
  expect(captured.output).to.eql('');
  expect(String(error)).to.include('Deploy.push: failed to push config');
  expect(String(error)).to.include('reason: no-provider');
  expect(String(error)).to.include('No provider configured for this endpoint.');
  expect(error.cause).to.deep.include({ ok: false, config, reason: 'no-provider' });
  expect(Deploy.Error.diagnostic(error)).to.eql({ reason: 'no-provider' });
}
