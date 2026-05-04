import { describe, expect, Fs, it, Testing } from '../../-test.ts';
import { Cell } from '../../m.cell/mod.ts';
import { CellHelp } from '../../m.help/mod.ts';
import { stripAnsi } from '../common.ts';
import { CellCli } from '../mod.ts';

describe(`@sys/cell/cli`, () => {
  it('API', async () => {
    const m = await import('@sys/cell/cli');
    expect(m.CellCli).to.equal(CellCli);
  });

  it('root help → shows resource-backed root guidance', async () => {
    const res = await silent(() => CellCli.run({ argv: [] }));
    const text = stripAnsi(res.text);
    const guidance = await CellHelp.Root.load();

    expect(res.kind).to.eql('help');
    expect(text).to.contain('@sys/cell/cli');
    expect(text).to.contain(guidance.summary.split('\n')[0]);
    guidance.usage.forEach((line) => expect(text).to.contain(line));
    guidance.commands.forEach(([name, detail]) => {
      expect(text).to.contain(name);
      expect(text).to.contain(detail);
    });
    guidance.options.forEach(([name, detail]) => {
      expect(text).to.contain(name);
      expect(text).to.contain(detail);
    });
    expect(text).to.not.contain('help init');
    expect(text).to.not.contain('help agent');
    expect(text).to.not.contain('--dry-run');
  });

  it('init -h → shows resource-backed init help', async () => {
    const res = await silent(() => CellCli.run({ argv: ['init', '-h'] }));
    const text = stripAnsi(res.text);
    const guidance = await CellHelp.Init.load();

    expect(res.kind).to.eql('help');
    expect(text).to.contain('@sys/cell/cli init');
    guidance.usage.forEach((line) => expect(text).to.contain(line));
    guidance.safety.forEach((line) => expect(text).to.contain(line));
    expect(text).to.contain('--agent');
    expect(text).to.not.contain('folder-shaped metamedium');
    expect(text).to.not.contain('Writes');
  });

  it('dsl → shows the Cell edit language', async () => {
    const res = await silent(() => CellCli.run({ argv: ['dsl'] }));
    const text = stripAnsi(res.text);
    const guidance = await CellHelp.Dsl.load();

    expect(res.kind).to.eql('help');
    expect(text).to.contain('@sys/cell/cli dsl');
    expect(text).to.contain(guidance.intro.split('\n')[0]);
    expect(text).to.contain('Speech acts');
    expect(text).to.contain('Owners');
    expect(text).to.contain('Mappings');
  });

  it('help topics are not commands in the greenfield CLI grammar', async () => {
    const res = await silent(() => CellCli.run({ argv: ['help', 'init'] }));

    expect(res.kind).to.eql('error');
    expect(res.text).to.contain('Unknown command: help');
  });

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
    expect(await Fs.exists(Fs.join(fs.dir, '-config/@sys.cell/cell.yaml'))).to.eql(false);
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
    expect(await Fs.exists(Fs.join(fs.dir, '-config/@sys.cell/cell.yaml'))).to.eql(true);

    const cell = await Cell.load(fs.dir);
    expect(cell.descriptor.kind).to.eql('cell');
  });

  it('init → rejects an existing invalid Cell descriptor without overwrite', async () => {
    const fs = await Testing.dir('CellCli.init.invalid-descriptor');
    const descriptor = Fs.join(fs.dir, '-config/@sys.cell/cell.yaml');
    const invalid = 'bad: true\n';

    await Fs.write(descriptor, invalid);

    const res = await silent(() => CellCli.run({ argv: ['init', fs.dir] }));

    expect(res.kind).to.eql('error');
    expect(res.text).to.contain('existing descriptor is invalid');
    expect(await read(descriptor)).to.eql(invalid);
  });
});

async function silent<T>(fn: () => Promise<T>) {
  const info = console.info;
  console.info = () => undefined;

  try {
    return await fn();
  } finally {
    console.info = info;
  }
}

async function read(path: string) {
  const res = await Fs.readText(path);
  if (!res.ok) throw res.error;
  return res.data ?? '';
}
