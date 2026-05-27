import { describe, expect, Fs, it, Testing } from '../../-test.ts';
import { CellPaths } from '../../m.cell/u.paths.ts';
import { stripAnsi } from '../common.ts';
import { CellCli } from '../mod.ts';
import { read, silent } from './u.fixture.ts';

const descriptor = 'kind: cell\nversion: 1\n';

describe('@sys/cell/cli migrate', () => {
  it('migrate --dry-run → reports the planned descriptor move without mutation', async () => {
    const fs = await Testing.dir('CellCli.migrate.dry-run');
    const legacy = Fs.join(fs.dir, CellPaths.legacy.descriptor);
    const canonical = Fs.join(fs.dir, CellPaths.descriptor);
    await Fs.write(legacy, descriptor, { force: true });

    const res = await silent(() => CellCli.run({ argv: ['migrate', fs.dir, '--dry-run'] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('migrate');
    if (res.kind !== 'migrate') throw new Error('expected migrate result');
    expect(res.dryRun).to.eql(true);
    expect(res.planned).to.eql([{ from: CellPaths.legacy.descriptor, to: CellPaths.descriptor }]);
    expect(text).to.contain('@sys/cell/cli migrate');
    expect(text).to.contain('dry-run; no files moved');
    expect(text).to.contain('would migrate');
    expect(text).to.contain(CellPaths.legacy.descriptor);
    expect(text).to.contain(CellPaths.descriptor);
    expect(await read(legacy)).to.eql(descriptor);
    expect(await Fs.exists(canonical)).to.eql(false);
  });

  it('migrate → moves the legacy descriptor to the canonical path', async () => {
    const fs = await Testing.dir('CellCli.migrate.apply');
    const legacy = Fs.join(fs.dir, CellPaths.legacy.descriptor);
    const canonical = Fs.join(fs.dir, CellPaths.descriptor);
    await Fs.write(legacy, descriptor, { force: true });

    const res = await silent(() => CellCli.run({ argv: ['migrate', fs.dir] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('migrate');
    if (res.kind !== 'migrate') throw new Error('expected migrate result');
    expect(res.migrated).to.eql([{ from: CellPaths.legacy.descriptor, to: CellPaths.descriptor }]);
    expect(text).to.contain('migrated');
    expect(await Fs.exists(legacy)).to.eql(false);
    expect(await read(canonical)).to.eql(descriptor);
  });

  it('migrate → fails on ambiguity without mutation', async () => {
    const fs = await Testing.dir('CellCli.migrate.ambiguous');
    const legacy = Fs.join(fs.dir, CellPaths.legacy.descriptor);
    const canonical = Fs.join(fs.dir, CellPaths.descriptor);
    await Fs.write(legacy, descriptor, { force: true });
    await Fs.write(canonical, descriptor, { force: true });

    const res = await silent(() => CellCli.run({ argv: ['migrate', fs.dir] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('error');
    expect(text).to.contain('multiple descriptors found');
    expect(await read(legacy)).to.eql(descriptor);
    expect(await read(canonical)).to.eql(descriptor);
  });

  it('migrate → rejects invalid legacy descriptors without creating canonical', async () => {
    const fs = await Testing.dir('CellCli.migrate.invalid');
    const legacy = Fs.join(fs.dir, CellPaths.legacy.descriptor);
    const canonical = Fs.join(fs.dir, CellPaths.descriptor);
    const invalid = 'bad: true\n';
    await Fs.write(legacy, invalid, { force: true });

    const res = await silent(() => CellCli.run({ argv: ['migrate', fs.dir] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('error');
    expect(text).to.contain('legacy descriptor is invalid');
    expect(await read(legacy)).to.eql(invalid);
    expect(await Fs.exists(canonical)).to.eql(false);
  });
});
