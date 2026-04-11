import { describe, expect, expectError, it, Fs, Str } from '../../-test.ts';
import { parseArgs } from '../u.args.ts';
import { resolveNonInteractive } from '../u.resolve.nonInteractive.ts';

describe('@sys/tools/pull non-interactive resolution', () => {
  it('resolves --config via PullFs', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'sys.tools.pull.resolve.' })).absolute;
    const yamlRel = '-config/@sys.tools.pull/sample.yaml';
    await Fs.write(
      `${cwd}/${yamlRel}`,
      Str.dedent(`
      dir: ./workspace
      bundles:
        - kind: http
          dist: https://fs.db.team/dist.json
          local:
            dir: ./pulled/sys.fs
      `).trimStart(),
    );

    const res = await resolveNonInteractive(cwd, parseArgs(['--no-interactive', '--config', `./${yamlRel}`]));
    expect(res.yamlPath).to.eql(`${cwd}/${yamlRel}`);
    expect(res.location.dir).to.eql(`${cwd}/workspace`);
    expect(res.location.bundles?.[0]?.kind).to.eql('http');
  });

  it('requires --config with --no-interactive', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'sys.tools.pull.resolve.' })).absolute;
    await expectError(
      () => resolveNonInteractive(cwd, parseArgs(['--no-interactive'])),
      'Missing required flag: --config',
    );
  });

  it('fails clearly when the config cannot load', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'sys.tools.pull.resolve.' })).absolute;
    await expectError(
      () => resolveNonInteractive(cwd, parseArgs(['--no-interactive', '--config', './missing.yaml'])),
      'Could not load pull config',
    );
  });
});
