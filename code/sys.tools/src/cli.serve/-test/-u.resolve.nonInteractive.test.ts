import { describe, expect, expectError, it } from '../../-test.ts';
import { parseArgs } from '../u.args.ts';
import { resolveNonInteractive } from '../u.resolve.nonInteractive.ts';
import { Fixture } from './u.ts';

describe('@sys/tools/serve non-interactive resolution', () => {
  it('resolves --dir into a runtime location', async () => {
    const cwd = await Fixture.makeTempDir('serve-resolve');
    const args = parseArgs(['--no-interactive', '--dir', './site', '--host', 'network', '--open']);
    const res = await resolveNonInteractive(cwd, args);

    expect(res.host).to.eql('network');
    expect(res.open).to.eql(true);
    expect(res.location.name).to.eql('site');
    expect(res.location.dir).to.eql(`${cwd}/site`);
  });

  it('resolves --config via ServeFs', async () => {
    const cwd = await Fixture.makeTempDir('serve-resolve');
    const configDir = `${cwd}/-config/@sys.tools.serve`;
    await Fixture.writeFile(cwd, '-config/@sys.tools.serve/sample.yaml', 'name: Sample\ndir: ./dist\n');
    const yamlPath = `${configDir}/sample.yaml`;

    const args = parseArgs(['--no-interactive', '--config', yamlPath]);
    const res = await resolveNonInteractive(cwd, args);

    expect(res.host).to.eql('local');
    expect(res.open).to.eql(false);
    expect(res.location.name).to.eql('Sample');
    expect(res.location.dir).to.eql(`${cwd}/dist`);
  });

  it('requires exactly one of --dir or --config', async () => {
    const cwd = await Fixture.makeTempDir('serve-resolve');

    await expectError(
      () => resolveNonInteractive(cwd, parseArgs(['--no-interactive'])),
      'Exactly one of --dir or --config is required',
    );
    await expectError(
      () => resolveNonInteractive(cwd, parseArgs(['--no-interactive', '--dir', '.', '--config', './x.yaml'])),
      'Exactly one of --dir or --config is required',
    );
  });

  it('rejects invalid --host', async () => {
    const cwd = await Fixture.makeTempDir('serve-resolve');
    await expectError(
      () => resolveNonInteractive(cwd, parseArgs(['--no-interactive', '--dir', '.', '--host', 'wide'])),
      'Invalid --host value',
    );
  });
});
