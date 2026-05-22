import { describe, expect, it } from '../../-test.ts';
import { CellHelp } from '../../m.help/mod.ts';
import { c, stripAnsi } from '../common.ts';
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
    expect(text.indexOf('jsr:@sys/cell dsl')).to.be.lessThan(
      text.indexOf('jsr:@sys/cell init'),
    );
    expect(text.indexOf('Commands')).to.be.lessThan(text.indexOf('Options'));
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
    expect(text).to.contain('@sys/cell init');
    guidance.usage.forEach((line) => expect(text).to.contain(line));
    guidance.safety.forEach((line) => expect(text).to.contain(line));
    expect(text).to.contain('--agent');
    expect(text).to.not.contain('folder-shaped metamedium');
    expect(text).to.not.contain('Writes');
  });

  it('task -h → shows resource-backed task help', async () => {
    const res = await silent(() => CellCli.run({ argv: ['task', '-h'] }));
    const text = stripAnsi(res.text);
    const guidance = await CellHelp.Task.load();

    expect(res.kind).to.eql('help');
    expect(text).to.contain('@sys/cell task');
    guidance.usage.forEach((line) => expect(text).to.contain(line));
    guidance.task.forEach((line) => expect(text).to.contain(line));
    expect(text).to.not.contain('--agent');
    expect(text).to.not.contain('--dry-run');
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
    expect(text).to.not.contain('--agent');
    expect(text).to.not.contain('--dry-run');
  });

  it('unknown commands show a yellow warning and root help', async () => {
    const help = await silent(() => CellCli.run({ argv: ['help', 'init'] }));
    const run = await silent(() => CellCli.run({ argv: ['run', '-h'] }));
    const text = stripAnsi(run.text);

    expect(help.kind).to.eql('error');
    expect(stripAnsi(help.text)).to.contain('⚠ Unknown command: help');
    expect(run.kind).to.eql('error');
    expect(run.text).to.contain(c.yellow('⚠ Unknown command: run'));
    expect(text).to.contain('@sys/cell');
    expect(text).to.not.contain('@sys/cell run');
    expect(text).to.not.contain('Unknown task');
    expect(text).to.not.contain('Unknown command: run\n\n\n');
  });
});
