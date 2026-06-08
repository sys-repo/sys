import { describe, expect, Fs, it, Testing } from '../../-test.ts';
import { Cell } from '../../m.cell/mod.ts';
import { CellPaths } from '../../m.cell/u/paths.ts';
import { stripAnsi } from '../common.ts';
import { CellCli } from '../mod.ts';
import { read, silent } from './u.fixture.ts';

describe(`@sys/cell/cli init`, () => {
  it('init --dry-run → reports template writes without changing files', async () => {
    const fs = await Testing.dir('CellCli.init.dry-run');

    const res = await silent(() => CellCli.run({ argv: ['init', fs.dir, '--dry-run'] }));

    expect(res.kind).to.eql('init');
    if (res.kind !== 'init') throw new Error('expected init result');
    const text = stripAnsi(res.text);

    expect(res.dryRun).to.eql(true);
    expect(res.ops.filter((op) => op.kind === 'create').length).to.eql(4);
    expect(text).to.contain(`target   ${fs.dir}`);
    expect(text).to.contain('create   ./-config/@sys.cell/cell.yaml');
    expect(text).to.contain('./.gitignore');
    expect(await Fs.exists(Fs.join(fs.dir, CellPaths.descriptor))).to.eql(false);
    expect(await Fs.exists(Fs.join(fs.dir, CellPaths.legacy.descriptor))).to.eql(false);
  });

  it('init → materializes Cell contract and preserves Pi-owned structure', async () => {
    const fs = await Testing.dir('CellCli.init.pi-coexist');
    const piState = Fs.join(fs.dir, '.pi/state.json');
    const piConfig = Fs.join(fs.dir, '-config/@sys.pi/profile.yaml');

    await Fs.write(piState, '{"ok":true}\n');
    await Fs.write(piConfig, 'profile: test\n');

    const res = await silent(() => CellCli.run({ argv: ['init', fs.dir] }));

    expect(res.kind).to.eql('init');
    expect(await read(piState)).to.eql('{"ok":true}\n');
    expect(await read(piConfig)).to.eql('profile: test\n');
    expect(await Fs.exists(Fs.join(fs.dir, 'data/README.md'))).to.eql(true);
    expect(await Fs.exists(Fs.join(fs.dir, 'view/README.md'))).to.eql(true);
    expect(await Fs.exists(Fs.join(fs.dir, CellPaths.descriptor))).to.eql(true);
    expect(await Fs.exists(Fs.join(fs.dir, CellPaths.legacy.descriptor))).to.eql(false);

    const cell = await Cell.load(fs.dir);
    expect(cell.descriptor.kind).to.eql('cell');
  });

  it('init → rejects an existing invalid canonical Cell descriptor without overwrite', async () => {
    const fs = await Testing.dir('CellCli.init.invalid-canonical-descriptor');
    const descriptor = Fs.join(fs.dir, CellPaths.descriptor);
    const invalid = 'bad: true\n';

    await Fs.write(descriptor, invalid);

    const res = await silent(() => CellCli.run({ argv: ['init', fs.dir] }));

    expect(res.kind).to.eql('error');
    expect(res.text).to.contain('existing descriptor is invalid');
    expect(await read(descriptor)).to.eql(invalid);
  });

  it('init → rejects an existing invalid legacy Cell descriptor without overwrite', async () => {
    const fs = await Testing.dir('CellCli.init.invalid-legacy-descriptor');
    const descriptor = Fs.join(fs.dir, CellPaths.legacy.descriptor);
    const invalid = 'bad: true\n';

    await Fs.write(descriptor, invalid);

    const res = await silent(() => CellCli.run({ argv: ['init', fs.dir] }));

    expect(res.kind).to.eql('error');
    expect(res.text).to.contain('existing descriptor is invalid');
    expect(await read(descriptor)).to.eql(invalid);
  });

  it('init → rejects an existing valid legacy descriptor without creating canonical', async () => {
    const fs = await Testing.dir('CellCli.init.valid-legacy-descriptor');
    const legacy = Fs.join(fs.dir, CellPaths.legacy.descriptor);
    const canonical = Fs.join(fs.dir, CellPaths.descriptor);

    await Fs.write(legacy, 'kind: cell\nversion: 1\n');

    const res = await silent(() => CellCli.run({ argv: ['init', fs.dir] }));

    expect(res.kind).to.eql('error');
    expect(res.text).to.contain('existing legacy descriptor found');
    expect(res.text).to.contain(CellPaths.legacy.descriptor);
    expect(res.text).to.contain(CellPaths.descriptor);
    expect(await Fs.exists(legacy)).to.eql(true);
    expect(await Fs.exists(canonical)).to.eql(false);
  });

  it('init → rejects ambiguous canonical and legacy descriptors', async () => {
    const fs = await Testing.dir('CellCli.init.ambiguous-descriptor');

    await Fs.write(Fs.join(fs.dir, CellPaths.descriptor), 'kind: cell\nversion: 1\n');
    await Fs.write(Fs.join(fs.dir, CellPaths.legacy.descriptor), 'kind: cell\nversion: 1\n');

    const res = await silent(() => CellCli.run({ argv: ['init', fs.dir] }));

    expect(res.kind).to.eql('error');
    expect(res.text).to.contain('multiple descriptors found');
    expect(res.text).to.contain(CellPaths.descriptor);
    expect(res.text).to.contain(CellPaths.legacy.descriptor);
  });
});
