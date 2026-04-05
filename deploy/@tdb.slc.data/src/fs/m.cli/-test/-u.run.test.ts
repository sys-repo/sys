import { describe, expect, expectError, it, Path } from '../../../-test.ts';
import { Fs } from '../../common.ts';
import { SlcDataCli } from '../mod.ts';

describe('SlcDataCli.run', () => {
  it('renders help text', async () => {
    const result = await SlcDataCli.run({ argv: ['--help'] });

    expect(result.kind).to.eql('help');
    if (result.kind !== 'help') throw new Error('Expected help result');
    expect(result.text.includes('create --profile <name> --source <path>')).to.eql(true);
    expect(result.text.includes('--profile <name>')).to.eql(true);
    expect(result.text.includes('--source <path>')).to.eql(true);
    expect(result.text.includes('stage  --profile <name>')).to.eql(true);
  });

  it('creates a sample profile in non-interactive mode', async () => {
    const dir = await Fs.makeTempDir();

    try {
      const cwd = dir.absolute;
      const result = await SlcDataCli.run({
        cwd,
        argv: ['create', '--profile', 'sample-1', '--source', './src/-test/sample-1'],
      });

      expect(result.kind).to.eql('created');
      if (result.kind !== 'created') throw new Error('Expected created result');
      expect(result.path).to.eql(SlcDataCli.StageProfile.path(cwd, 'sample-1'));
      expect(await Fs.exists(result.path)).to.eql(true);
    } finally {
      await Fs.remove(dir.absolute);
    }
  });

  it('stages a named profile in non-interactive mode', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');
    const sample = Path.resolve(root, '../../../-test/sample-1');
    const dir = await Fs.makeTempDir();

    try {
      const cwd = dir.absolute;
      const localSample = Fs.join(cwd, 'src/-test/sample-1');
      await Fs.copy(sample, localSample);
      await SlcDataCli.StageProfile.create({
        cwd,
        profile: 'sample-1',
        source: './src/-test/sample-1',
      });

      const result = await SlcDataCli.run({
        cwd,
        argv: ['stage', '--profile', 'sample-1'],
      });

      expect(result.kind).to.eql('staged');
      if (result.kind !== 'staged' || !('dirs' in result)) throw new Error('Expected staged profile result');
      expect(result.dirs).to.eql([SlcDataCli.StageProfile.fs.target(cwd, 'sample-1')]);
      expect(await Fs.exists(Fs.join(result.dirs[0], 'manifests/slug-tree.sample-1.json'))).to.eql(true);
    } finally {
      await Fs.remove(dir.absolute);
    }
  });

  it('fails when create is missing a profile', () =>
    expectError(
      () => SlcDataCli.run({ argv: ['create', '--source', './src/-test/sample-1'] }),
      "Missing --profile for 'create'",
    ));

  it('fails when create is missing a source', () =>
    expectError(
      () => SlcDataCli.run({ argv: ['create', '--profile', 'sample-1'] }),
      "Missing --source for 'create'",
    ));

  it('fails when stage is missing a profile', () =>
    expectError(() => SlcDataCli.run({ argv: ['stage'] }), "Missing --profile for 'stage'"));
});
