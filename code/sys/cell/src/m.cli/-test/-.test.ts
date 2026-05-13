import { describe, expect, Fs, it, Str, Testing } from '../../-test.ts';
import { Cell } from '../../m.cell/mod.ts';
import { CellHelp } from '../../m.help/mod.ts';
import { c, stripAnsi } from '../common.ts';
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

  it('--format is scoped to dsl only', async () => {
    const root = stripAnsi((await silent(() => CellCli.run({ argv: ['--format', 'skill'] }))).text);
    const init = stripAnsi(
      (await silent(() => CellCli.run({ argv: ['init', '--format', 'skill'] }))).text,
    );
    const task = stripAnsi(
      (await silent(() => CellCli.run({ argv: ['task', '--format', 'skill'] }))).text,
    );
    const start = stripAnsi(
      (await silent(() => CellCli.run({ argv: ['start', '--format', 'skill'] }))).text,
    );

    expect(root).to.contain('Unexpected option without command: --format');
    expect(root).to.contain('@sys/cell');
    expect(init).to.contain('Unexpected option for init: --format');
    expect(init).to.contain('@sys/cell init');
    expect(task).to.contain('Unexpected option for task: --format');
    expect(task).to.contain('@sys/cell task');
    expect(start).to.contain('Unexpected option for start: --format');
    expect(start).to.contain('@sys/cell start');
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

  it('task → runs a named finite task', async () => {
    resetTaskEvents();
    const fs = await Testing.dir('CellCli.task.run');
    await Fs.write(
      Fs.join(fs.dir, '-config/@sys.cell/cell.yaml'),
      Str.dedent(`
        kind: cell
        version: 1

        tasks:
          - name: capture
            from: ./-tasks/capture.ts
            use: CaptureTask
            config: ./-config/capture.yaml
      `).trimStart(),
    );
    await Fs.write(Fs.join(fs.dir, '-config/capture.yaml'), `value: from-config\n`);
    await Fs.write(Fs.join(fs.dir, '-tasks/capture.ts'), taskSource('CaptureTask'));

    const res = await silent(() => CellCli.run({ argv: ['task', 'capture', fs.dir] }));
    const text = stripAnsi(res.text);
    const event = taskEvents()[0];

    expect(res.kind).to.eql('task');
    if (res.kind !== 'task') throw new Error('expected task result');
    expect(res.root).to.eql(fs.dir);
    expect(res.task).to.eql('capture');
    expect(res.steps).to.eql(1);
    expect(text).to.contain(`root    ${fs.dir}`);
    expect(text).to.contain('task    capture');
    expect(text).to.contain('steps   1');
    expect(text).to.contain('ok      capture');
    expect(event.args.cwd).to.eql(fs.dir);
    expect(event.args).to.not.have.property('config');
    expect(event.args.paths.config).to.eql(Fs.join(fs.dir, '-config/capture.yaml'));
  });

  it('task --plan → prints a task closure without importing endpoints', async () => {
    resetTaskEvents();
    const fs = await Testing.dir('CellCli.task.plan');
    await Fs.write(
      Fs.join(fs.dir, '-config/@sys.cell/cell.yaml'),
      Str.dedent(`
        kind: cell
        version: 1

        tasks:
          - name: capture
            from: ./-tasks/capture.ts
            use: CaptureTask
            config: ./-config/capture.yaml
          - name: clean
            from: ./-tasks/clean.ts
            use: CleanTask
          - name: all
            steps:
              - task: capture
              - task: clean
      `).trimStart(),
    );
    await Fs.write(Fs.join(fs.dir, '-tasks/capture.ts'), taskSource('CaptureTask'));
    await Fs.write(Fs.join(fs.dir, '-tasks/clean.ts'), taskSource('CleanTask'));

    const res = await silent(() => CellCli.run({ argv: ['task', 'all', fs.dir, '--plan'] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('task-plan');
    if (res.kind !== 'task-plan') throw new Error('expected task plan result');
    expect(res.root).to.eql(fs.dir);
    expect(res.task).to.eql('all');
    expect(res.steps).to.eql(2);
    expect(text).to.contain(`root    ${fs.dir}`);
    expect(text).to.contain('task    all');
    expect(text).to.contain('steps   2');
    expect(text).to.contain('all');
    expect(text).to.contain('├─ capture');
    expect(text).to.contain('│  from ./-tasks/capture.ts');
    expect(text).to.contain('│  use  CaptureTask');
    expect(text).to.contain('│  config ./-config/capture.yaml');
    expect(text).to.contain('└─ clean');
    expect(text).to.contain('   from ./-tasks/clean.ts');
    expect(text).to.contain('   use  CleanTask');
    expect(text).to.not.contain('config -');
    expect(taskEvents()).to.eql([]);
  });

  it('start → loads and starts an empty Cell services set', async () => {
    const fs = await Testing.dir('CellCli.start.empty-services');
    await silent(() => CellCli.run({ argv: ['init', fs.dir] }));

    const res = await silent(() => CellCli.run({ argv: ['start', fs.dir] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('start');
    if (res.kind !== 'start') throw new Error('expected start result');
    expect(res.root).to.eql(fs.dir);
    expect(res.services).to.eql(0);
    expect(text).to.contain(`root       ${fs.dir}`);
    expect(text).to.contain('services   0');
  });

  it('task → rejects missing names, unsupported options, and extra args', async () => {
    const missing = stripAnsi(
      (await silent(() => CellCli.run({ argv: ['task'] }))).text,
    );
    const help = stripAnsi(
      (await silent(() => CellCli.run({ argv: ['task', '--dry-run'] }))).text,
    );
    const extra = stripAnsi(
      (await silent(() => CellCli.run({ argv: ['task', 'capture', '.', 'extra'] }))).text,
    );

    expect(missing).to.contain('Missing task name.');
    expect(missing).to.contain('@sys/cell task');
    expect(help).to.contain('Unexpected option for task: --dry-run');
    expect(help).to.contain('@sys/cell task');
    expect(extra).to.contain('Unexpected argument: extra');
    expect(extra).to.contain('@sys/cell task');
  });

  it('--plan is scoped to task only', async () => {
    const root = stripAnsi((await silent(() => CellCli.run({ argv: ['--plan'] }))).text);
    const init = stripAnsi((await silent(() => CellCli.run({ argv: ['init', '--plan'] }))).text);
    const dsl = stripAnsi((await silent(() => CellCli.run({ argv: ['dsl', '--plan'] }))).text);
    const start = stripAnsi((await silent(() => CellCli.run({ argv: ['start', '--plan'] }))).text);

    expect(root).to.contain('Unexpected option without command: --plan');
    expect(init).to.contain('Unexpected option for init: --plan');
    expect(dsl).to.contain('Unexpected option for dsl: --plan');
    expect(start).to.contain('Unexpected option for start: --plan');
  });

  it('start → rejects unsupported command options and extra args', async () => {
    const help = stripAnsi(
      (await silent(() => CellCli.run({ argv: ['start', '--dry-run'] }))).text,
    );
    const extra = stripAnsi(
      (await silent(() => CellCli.run({ argv: ['start', '.', 'extra'] }))).text,
    );

    expect(help).to.contain('Unexpected option for start: --dry-run');
    expect(help).to.contain('@sys/cell start');
    expect(extra).to.contain('Unexpected argument: extra');
    expect(extra).to.contain('@sys/cell start');
  });
});

/**
 * Helpers:
 */
type TaskEvent = {
  readonly args: {
    readonly cwd: string;
    readonly paths: { readonly config?: string };
  };
};

type TaskGlobal = typeof globalThis & { __cellCliTaskEvents?: TaskEvent[] };

function resetTaskEvents() {
  (globalThis as TaskGlobal).__cellCliTaskEvents = [];
}

function taskEvents(): readonly TaskEvent[] {
  return (globalThis as TaskGlobal).__cellCliTaskEvents ?? [];
}

function taskSource(exportName: string) {
  return Str.dedent(`
    export const ${exportName} = {
      run(args: unknown) {
        const g = globalThis as unknown as { __cellCliTaskEvents?: unknown[] };
        g.__cellCliTaskEvents ??= [];
        g.__cellCliTaskEvents.push({ args });
        return { ok: true };
      },
    };
  `).trimStart();
}

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
