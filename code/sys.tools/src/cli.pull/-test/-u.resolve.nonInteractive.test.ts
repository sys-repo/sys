import { describe, expect, expectError, Fs, it } from '../../-test.ts';
import { parseArgs } from '../u.args.ts';
import { resolveNonInteractive } from '../u.resolve.nonInteractive.ts';

describe('@sys/tools/pull non-interactive resolution', () => {
  it('resolves --config without loading the owner YAML', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'sys.tools.pull.resolve.' })).absolute;
    const yamlRel = '-config/@sys.tools.pull/sample.yaml';

    const res = await resolveNonInteractive(
      cwd,
      parseArgs(['--non-interactive', '--config', `./${yamlRel}`]),
    );
    expect(res.config).to.eql(`${cwd}/${yamlRel}`);
  });

  it('requires --config with --non-interactive', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'sys.tools.pull.resolve.' })).absolute;
    await expectError(
      () => resolveNonInteractive(cwd, parseArgs(['--non-interactive'])),
      'Missing required flag: --config',
    );
  });

  it('does not validate config existence before Pull.run owns execution', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'sys.tools.pull.resolve.' })).absolute;
    const res = await resolveNonInteractive(
      cwd,
      parseArgs(['--non-interactive', '--config', './missing.yaml']),
    );
    expect(res.config).to.eql(`${cwd}/missing.yaml`);
  });
});
