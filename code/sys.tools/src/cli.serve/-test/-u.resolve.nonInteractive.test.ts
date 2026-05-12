import { describe, expect, expectError, it } from '../../-test.ts';
import { parseArgs } from '../u.args.ts';
import { resolveNonInteractive } from '../u.resolve.nonInteractive.ts';
import { Fixture } from './u.ts';

describe('@sys/tools/serve non-interactive resolution', () => {
  it('resolves --dir into a runtime location', async () => {
    const cwd = await Fixture.makeTempDir('serve-resolve');
    const args = parseArgs(['--non-interactive', '--dir', './site', '--host', 'network', '--open']);
    const res = await resolveNonInteractive(cwd, args);

    expect(res.host).to.eql('network');
    expect(res.open).to.eql(true);
    expect(res.selector).to.eql({ kind: 'dir', input: './site', dir: `${cwd}/site` });
    expect(res.location.name).to.eql('site');
    expect(res.location.dir).to.eql(`${cwd}/site`);
  });

  it('resolves --config via ServeFs', async () => {
    const cwd = await Fixture.makeTempDir('serve-resolve');
    const configDir = `${cwd}/-config/@sys.tools.serve`;
    await Fixture.writeFile(
      cwd,
      '-config/@sys.tools.serve/sample.yaml',
      'name: Sample\ndir: ./dist\n',
    );
    const yamlPath = `${configDir}/sample.yaml`;

    const args = parseArgs(['--non-interactive', '--config', yamlPath]);
    const res = await resolveNonInteractive(cwd, args);

    expect(res.host).to.eql('local');
    expect(res.open).to.eql(false);
    expect(res.selector).to.eql({ kind: 'config', config: yamlPath });
    expect(res.config).to.eql(yamlPath);
    expect(res.location.name).to.eql('Sample');
    expect(res.location.dir).to.eql(`${cwd}/dist`);
  });

  it('resolves --profile via ServeFs', async () => {
    const cwd = await Fixture.makeTempDir('serve-resolve-profile');
    await Fixture.writeFile(cwd, '-config/@sys.tools.serve/view.yaml', 'name: View\ndir: ./view\n');

    const args = parseArgs(['--non-interactive', '--profile', 'view']);
    const res = await resolveNonInteractive(cwd, args);

    expect(res.selector).to.eql({
      kind: 'profile',
      profile: 'view',
      config: `${cwd}/-config/@sys.tools.serve/view.yaml`,
    });
    expect(res.config).to.eql(`${cwd}/-config/@sys.tools.serve/view.yaml`);
    expect(res.location.name).to.eql('View');
    expect(res.location.dir).to.eql(`${cwd}/view`);
  });

  it('requires exactly one of --dir, --config or --profile', async () => {
    const cwd = await Fixture.makeTempDir('serve-resolve');

    await expectError(
      () => resolveNonInteractive(cwd, parseArgs(['--non-interactive'])),
      'exactly one of dir, config or profile is required',
    );
    await expectError(
      () =>
        resolveNonInteractive(
          cwd,
          parseArgs(['--non-interactive', '--dir', '.', '--config', './x.yaml']),
        ),
      'exactly one of dir, config or profile is required',
    );
    await expectError(
      () =>
        resolveNonInteractive(
          cwd,
          parseArgs(['--non-interactive', '--dir', '.', '--profile', 'view']),
        ),
      'exactly one of dir, config or profile is required',
    );
  });

  it('rejects invalid --host', async () => {
    const cwd = await Fixture.makeTempDir('serve-resolve');
    await expectError(
      () =>
        resolveNonInteractive(
          cwd,
          parseArgs(['--non-interactive', '--dir', '.', '--host', 'wide']),
        ),
      'invalid host value',
    );
  });
});
