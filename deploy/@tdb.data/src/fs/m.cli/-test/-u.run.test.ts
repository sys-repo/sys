import { describe, expect, expectError, it, Path } from '../../../-test.ts';
import { Fs, Str } from '../../common.ts';
import { SlugDataCli } from '../mod.ts';

describe('SlugDataCli.run', () => {
  it('renders help text', async () => {
    const result = await SlugDataCli.run({ argv: ['--help'] });

    expect(result.kind).to.eql('help');
    if (result.kind !== 'help') throw new Error('Expected help result');
    expect(result.text.includes('create --profile <name> --source <path>')).to.eql(true);
    expect(result.text.includes('--profile <name>')).to.eql(true);
    expect(result.text.includes('--source <path>')).to.eql(true);
    expect(result.text.includes('stage  --profile <name>')).to.eql(true);
    expect(SlugDataCli.Fmt.result(result)).to.eql(result.text);
  });

  it('creates a sample profile in non-interactive mode', async () => {
    const dir = await Fs.makeTempDir();

    try {
      const cwd = dir.absolute;
      const result = await SlugDataCli.run({
        cwd,
        argv: ['create', '--profile', 'sample-1', '--source', './src/-test/sample-1'],
      });

      expect(result.kind).to.eql('created');
      if (result.kind !== 'created') throw new Error('Expected created result');
      expect(result.path).to.eql(SlugDataCli.StageProfile.path(cwd, 'sample-1'));
      expect(await Fs.exists(result.path)).to.eql(true);
      expect(SlugDataCli.Fmt.result(result).includes('Created profile:')).to.eql(true);
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
      await SlugDataCli.StageProfile.create({
        cwd,
        profile: 'sample-1',
        source: './src/-test/sample-1',
      });

      const result = await SlugDataCli.run({
        cwd,
        argv: ['stage', '--profile', 'sample-1'],
      });

      expect(result.kind).to.eql('staged');
      if (result.kind !== 'staged' || !('dirs' in result)) throw new Error('Expected staged profile result');
      expect(result.dirs).to.eql([SlugDataCli.StageProfile.fs.target(cwd, 'sample-1')]);
      expect(await Fs.exists(Fs.join(result.dirs[0], 'manifests/slug-tree.sample-1.json'))).to.eql(true);
      expect(SlugDataCli.Fmt.result(result).includes('Staged mount:')).to.eql(true);
    } finally {
      await Fs.remove(dir.absolute);
    }
  });

  it('stages a slug-dataset profile in non-interactive mode', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');
    const sample = Path.resolve(root, '../../../-test/sample-2.yaml.authored');
    const dir = await Fs.makeTempDir();

    try {
      const cwd = dir.absolute;
      const localSample = Fs.join(cwd, 'src/-test/sample-2.yaml.authored');
      const profilePath = SlugDataCli.StageProfile.path(cwd, 'sample-2');
      await Fs.copy(sample, localSample);
      await Fs.write(profilePath, Str.dedent(`
        mappings:
          - kind: slug-dataset
            source: ./src/-test/sample-2.yaml.authored
      `));

      const result = await SlugDataCli.run({
        cwd,
        argv: ['stage', '--profile', 'sample-2'],
      });

      expect(result.kind).to.eql('staged');
      if (result.kind !== 'staged' || !('dirs' in result)) throw new Error('Expected staged profile result');
      expect(result.dirs).to.eql([
        Fs.join(SlugDataCli.StageProfile.fs.targetRoot(cwd), 'prog.core'),
        Fs.join(SlugDataCli.StageProfile.fs.targetRoot(cwd), 'prog.p2p'),
      ]);
      expect(await Fs.exists(Fs.join(SlugDataCli.StageProfile.fs.targetRoot(cwd), 'mounts.json'))).to.eql(true);
      expect(await Fs.exists(Fs.join(result.dirs[0]!, 'manifests/slug-tree.prog.core.json'))).to.eql(true);
      expect(await Fs.exists(Fs.join(result.dirs[1]!, 'manifests/slug-tree.prog.p2p.json'))).to.eql(true);
      expect(SlugDataCli.Fmt.result(result).includes('Staged mounts:')).to.eql(true);
    } finally {
      await Fs.remove(dir.absolute);
    }
  });

  it('refreshes staged-root metadata in non-interactive mode', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');
    const sample = Path.resolve(root, '../../../-test/sample-1');
    const dir = await Fs.makeTempDir();

    try {
      const cwd = dir.absolute;
      const target = Fs.join(cwd, 'public/data');
      await SlugDataCli.StageProfile.create({
        cwd,
        profile: 'sample-1',
        source: sample,
      });
      await SlugDataCli.StageProfile.stage({
        cwd,
        profile: 'sample-1',
        target,
      });
      await Fs.remove(Fs.join(target, 'sample-1'));

      const result = await SlugDataCli.run({
        cwd,
        argv: ['refresh', '--target', target],
      });

      expect(result.kind).to.eql('refresh-root');
      if (result.kind !== 'refresh-root') throw new Error('Expected refresh-root result');
      expect(result.root).to.eql(target);
      expect(result.mountsPath).to.eql(Fs.join(target, 'mounts.json'));
      expect(result.distPath).to.eql(Fs.join(target, 'dist.json'));
      expect((await Fs.readJson(result.mountsPath)).data).to.eql({ mounts: [] });
      expect(await Fs.exists(result.distPath)).to.eql(true);
      expect(SlugDataCli.Fmt.result(result).includes('Refreshed mounts index:')).to.eql(true);
    } finally {
      await Fs.remove(dir.absolute);
    }
  });

  it('fails when create is missing a profile', () =>
    expectError(
      () => SlugDataCli.run({ argv: ['create', '--source', './src/-test/sample-1'] }),
      "Missing --profile for 'create'",
    ));

  it('fails when create is missing a source', () =>
    expectError(
      () => SlugDataCli.run({ argv: ['create', '--profile', 'sample-1'] }),
      "Missing --source for 'create'",
    ));

  it('fails when stage is missing a profile', () =>
    expectError(() => SlugDataCli.run({ argv: ['stage'] }), "Missing --profile for 'stage'"));

  it('fails when refresh is missing a target', () =>
    expectError(() => SlugDataCli.run({ argv: ['refresh'] }), "Missing --target for 'refresh'"));
});
