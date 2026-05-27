import { describe, expect, it } from '../../-test.ts';
import { CellHelp } from '../../m.help/mod.ts';
import { stripAnsi } from '../common.ts';
import { CellCli } from '../mod.ts';
import { silent } from './u.fixture.ts';

describe(`@sys/cell/cli help`, () => {
  it('root help → shows resource-backed root guidance', async () => {
    const res = await silent(() => CellCli.run({ argv: [] }));
    const text = stripAnsi(res.text);
    const guidance = await CellHelp.Root.load();

    expect(res.kind).to.eql('help');
    expect(text).to.contain('@sys/cell');
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
  });

  it('init -h → shows resource-backed init help', async () => {
    const res = await silent(() => CellCli.run({ argv: ['init', '-h'] }));
    const text = stripAnsi(res.text);
    const guidance = await CellHelp.Init.load();

    expect(res.kind).to.eql('help');
    expect(text).to.contain('@sys/cell init');
    guidance.usage.forEach((line) => expect(text).to.contain(line));
    guidance.safety.forEach((line) => expect(text).to.contain(line));
    expect(text).to.contain('--agent');
  });

  it('migrate -h → shows resource-backed migrate help', async () => {
    const res = await silent(() => CellCli.run({ argv: ['migrate', '-h'] }));
    const text = stripAnsi(res.text);
    const guidance = await CellHelp.Migrate.load();

    expect(res.kind).to.eql('help');
    expect(text).to.contain('@sys/cell migrate');
    guidance.usage.forEach((line) => expect(text).to.contain(line));
    guidance.safety.forEach((line) => expect(text).to.contain(line));
    expect(text).to.contain('--dry-run');
  });

  it('task -h → shows resource-backed task help', async () => {
    const res = await silent(() => CellCli.run({ argv: ['task', '-h'] }));
    const text = stripAnsi(res.text);
    const guidance = await CellHelp.Task.load();

    expect(res.kind).to.eql('help');
    expect(text).to.contain('@sys/cell task');
    guidance.usage.forEach((line) => expect(text).to.contain(line));
    guidance.task.forEach((line) => expect(text).to.contain(line));
  });

  it('start -h → shows resource-backed start help', async () => {
    const res = await silent(() => CellCli.run({ argv: ['start', '-h'] }));
    const text = stripAnsi(res.text);
    const guidance = await CellHelp.Start.load();

    expect(res.kind).to.eql('help');
    expect(text).to.contain('@sys/cell start');
    guidance.services.forEach((line) => expect(text).to.contain(line));
    guidance.options.forEach(([name, detail]) => {
      expect(text).to.contain(name);
      expect(text).to.contain(detail);
    });
    expect(text).to.contain('--mode <mode>');
  });

  it('unknown commands fail with root help context', async () => {
    const help = await silent(() => CellCli.run({ argv: ['help', 'init'] }));
    const run = await silent(() => CellCli.run({ argv: ['run', '-h'] }));
    const text = stripAnsi(run.text);

    expect(help.kind).to.eql('error');
    if (help.kind !== 'error') throw new Error('expected error result');
    expect(help.code).to.eql(1);
    expect(stripAnsi(help.text)).to.contain('Unknown command: help');
    expect(run.kind).to.eql('error');
    if (run.kind !== 'error') throw new Error('expected error result');
    expect(run.code).to.eql(1);
    expect(text).to.contain('Unknown command: run');
    expect(text).to.contain('@sys/cell');
    expect(text).to.contain('@sys/cell migrate');
    expect(text).to.not.contain('@sys/cell run');
  });
});
