import { describe, expect, Fs, it, Str } from '../../-test.ts';
import { runEndpointAction } from '../u.endpointAction.ts';
import { withTmpDir } from './-fixtures.ts';

describe('@sys/tools/deploy endpoint actions', () => {
  it('stage → copies configured mappings into the staging root', async () => {
    await withTmpDir(async (cwd) => {
      const yamlPath = `${cwd}/-config/@sys.tools.deploy/slc.yaml`;
      await Fs.ensureDir(`${cwd}/src/site`);
      await Fs.write(
        `${cwd}/src/site/index.html`,
        '<!doctype html><html><body>slc</body></html>\n',
      );
      await Fs.write(
        yamlPath,
        Str.dedent(`
        source:
          dir: ./src
        staging:
          dir: ./stage
        mappings:
          - mode: copy
            dir:
              source: ./site
              staging: .
        `).trimStart(),
      );

      const res = await runEndpointAction({
        cwd,
        key: 'slc',
        yamlPath,
        action: 'stage',
      });

      expect(res.ok).to.eql(true);
      expect(res.stageOk).to.eql(true);
      expect(await Fs.exists(`${cwd}/stage/index.html`)).to.eql(true);
      expect(await Fs.exists(`${cwd}/stage/dist.json`)).to.eql(true);
    });
  });

  it('stage-push → preserves stage success when push is unavailable', async () => {
    await withTmpDir(async (cwd) => {
      const yamlPath = `${cwd}/-config/@sys.tools.deploy/slc.yaml`;
      await Fs.ensureDir(`${cwd}/src/site`);
      await Fs.write(
        `${cwd}/src/site/index.html`,
        '<!doctype html><html><body>slc</body></html>\n',
      );
      await Fs.write(
        yamlPath,
        Str.dedent(`
        provider:
          kind: noop
        source:
          dir: ./src
        staging:
          dir: ./stage
        mappings:
          - mode: copy
            dir:
              source: ./site
              staging: .
        `).trimStart(),
      );

      const res = await runEndpointAction({
        cwd,
        key: 'slc',
        yamlPath,
        action: 'stage-push',
      });

      expect(res.ok).to.eql(false);
      expect(res.stageOk).to.eql(true);
      expect(res.push?.ok).to.eql(false);
      expect(await Fs.exists(`${cwd}/stage/index.html`)).to.eql(true);
    });
  });
});
