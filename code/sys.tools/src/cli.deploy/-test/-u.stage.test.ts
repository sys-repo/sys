import { describe, expect, expectError, Fs, it, Path } from '../../-test.ts';
import { Deploy } from '../mod.ts';
import { captureInfo, providerlessPrebuiltStageYaml, withTmpDir } from './u.fixture.ts';

describe('@sys/tools/deploy programmatic stage', () => {
  it('stages providerless endpoint files from owner YAML', async () => {
    await withTmpDir(async (cwd) => {
      const { config, stagingRoot } = await writePrebuiltStageEndpoint(cwd);

      const captured = await captureInfo(() =>
        Deploy.stage({
          cwd,
          config: './-config/@sys.tools.deploy/stage.yaml',
        })
      );
      const result = captured.value;

      expect(captured.output).to.eql('');
      expect(result.ok).to.eql(true);
      expect(result.cwd).to.eql(cwd);
      expect(result.config).to.eql(config);
      expect(result.stagingRoot).to.eql(stagingRoot);

      const html = await Fs.readText(`${stagingRoot}/index.html`);
      expect(html.ok).to.eql(true);
      expect(html.data).to.include('ui');

      const dist = await Fs.readJson(`${stagingRoot}/dist.json`);
      expect(dist.ok).to.eql(true);
      expect(dist.exists).to.eql(true);
    });
  });

  it('accepts owner config refs from paths.config', async () => {
    await withTmpDir(async (cwd) => {
      const { config, stagingRoot } = await writePrebuiltStageEndpoint(cwd);

      const captured = await captureInfo(() =>
        Deploy.stage({
          cwd,
          paths: { config: './-config/@sys.tools.deploy/stage.yaml' },
        })
      );
      const result = captured.value;

      expect(captured.output).to.eql('');
      expect(result.ok).to.eql(true);
      expect(result.config).to.eql(config);
      expect(result.stagingRoot).to.eql(stagingRoot);
    });
  });

  it('accepts equivalent config refs', async () => {
    await withTmpDir(async (cwd) => {
      const { config, stagingRoot } = await writePrebuiltStageEndpoint(cwd);

      const result = await Deploy.stage({
        cwd,
        config: './-config/@sys.tools.deploy/stage.yaml',
        paths: { config },
      });

      expect(result.ok).to.eql(true);
      expect(result.config).to.eql(config);
      expect(result.stagingRoot).to.eql(stagingRoot);
    });
  });

  it('rejects conflicting config refs', async () => {
    await withTmpDir(async (cwd) => {
      await expectError(
        () =>
          Deploy.stage({
            cwd,
            config: './a.yaml',
            paths: { config: './b.yaml' },
          }),
        'Deploy.stage: config and paths.config resolve to different paths.',
      );
    });
  });

  it('fails clearly when owner YAML cannot be loaded', async () => {
    await withTmpDir(async (cwd) => {
      await expectError(
        () => Deploy.stage({ cwd, config: './missing.yaml' }),
        'Deploy.stage: failed to stage config',
      );
    });
  });
});

async function writePrebuiltStageEndpoint(cwd: string) {
  const config = `${cwd}/-config/@sys.tools.deploy/stage.yaml`;
  const source = `${cwd}/view/.pulled/ui.components`;
  const stagingRoot = Path.resolve(cwd, './.tmp/deploy/stage');

  await Fs.ensureDir(source);
  await Fs.write(`${source}/index.html`, '<!doctype html><html><body>ui</body></html>\n');
  await Fs.ensureDir(`${cwd}/-config/@sys.tools.deploy`);
  await Fs.write(config, providerlessPrebuiltStageYaml());

  return { config, stagingRoot };
}
