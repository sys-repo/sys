import { describe, expect, expectError, Fs, it, Str } from '../../-test.ts';
import { parseArgs } from '../u.args.ts';
import { resolveNonInteractive } from '../u.resolve.nonInteractive.ts';

describe('@sys/tools/deploy non-interactive resolution', () => {
  it('resolves --config and maps stage+push to the shared run action', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'sys.tools.deploy.resolve.' })).absolute;
    const yamlRel = '-config/@sys.tools.deploy/slc.yaml';
    await Fs.ensureDir(`${cwd}/src/site`);
    await Fs.write(`${cwd}/src/site/index.html`, '<!doctype html><html><body>slc</body></html>\n');
    await Fs.write(
      `${cwd}/${yamlRel}`,
      Str.dedent(
        `
      source:
        dir: ./src
      staging:
        dir: ./stage
      mappings:
        - mode: copy
          dir:
            source: ./site
            staging: .
      `,
      ).trimStart(),
    );

    const res = await resolveNonInteractive(
      cwd,
      parseArgs(['--no-interactive', '--config', `./${yamlRel}`, '--action', 'stage+push']),
    );

    expect(res.yamlPath).to.eql(`${cwd}/${yamlRel}`);
    expect(res.key).to.eql('slc');
    expect(res.action).to.eql('stage-push');
  });

  it('requires --config with --no-interactive', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'sys.tools.deploy.resolve.' })).absolute;
    await expectError(
      () => resolveNonInteractive(cwd, parseArgs(['--no-interactive', '--action', 'stage'])),
      'Missing required flag: --config',
    );
  });

  it('requires --action with --no-interactive', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'sys.tools.deploy.resolve.' })).absolute;
    await expectError(
      () => resolveNonInteractive(cwd, parseArgs(['--no-interactive', '--config', './x.yaml'])),
      'Missing required flag: --action',
    );
  });

  it('fails clearly for invalid actions', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'sys.tools.deploy.resolve.' })).absolute;
    const args = parseArgs(['--no-interactive', '--config', './x.yaml', '--action', 'serve']);
    await expectError(() => resolveNonInteractive(cwd, args), 'Invalid --action');
  });
});
