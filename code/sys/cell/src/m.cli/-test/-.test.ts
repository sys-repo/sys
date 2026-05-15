import { describe, expect, Fs, it, Str, Testing, Time } from '../../-test.ts';
import { Cell } from '../../m.cell/mod.ts';
import { CellHelp } from '../../m.help/mod.ts';
import { c, Cli, stripAnsi, type t } from '../common.ts';
import { CellCli } from '../mod.ts';
import { Fmt } from '../u.fmt.ts';
import { silent } from './u.fixture.ts';

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
            use: CaptureTask
            from: ./-tasks/capture.ts
            config: ./-config/capture.yaml
      `).trimStart(),
    );
    await Fs.write(Fs.join(fs.dir, '-config/capture.yaml'), `value: from-config\n`);
    await Fs.write(Fs.join(fs.dir, '-tasks/capture.ts'), taskSource('CaptureTask'));

    const res = await silent(() => CellCli.run({ argv: ['task', 'capture', fs.dir] }));
    const event = taskEvents()[0];

    expect(res.kind).to.eql('task');
    if (res.kind !== 'task') throw new Error('expected task result');
    expect(res.root).to.eql(fs.dir);
    expect(res.task).to.eql('capture');
    expect(res.steps).to.eql(1);
    expect(event.args.cwd).to.eql(fs.dir);
    expect(event.args).to.not.have.property('config');
    expect(event.args.paths.config).to.eql(Fs.join(fs.dir, '-config/capture.yaml'));
  });

  it('task progress renderer → uses CLI spinner formatting for lifecycle events', () => {
    const log: SpinnerLog[] = [];
    const render = Fmt.Task.progressRenderer({ spinner: fakeSpinner(log), silent: false });
    const root = taskCompositeDescriptor('all', ['pull:view', 'deploy:stage']);
    const pull = taskLeafDescriptor('pull:view');
    const deploy = taskLeafDescriptor('deploy:stage');

    const pullResult = taskStepResult(pull, true, 120);
    const deployResult = taskStepResult(deploy, false, 16);
    const width = stepCompletionLabelWidth([pull, deploy]);

    render({ kind: 'task:start', task: root, leaves: [pull, deploy] });
    render({ kind: 'task:step:start', rootTask: root, step: pull });
    render({ kind: 'task:step:ok', rootTask: root, step: pull, result: pullResult });
    render({ kind: 'task:step:start', rootTask: root, step: deploy });
    render({
      kind: 'task:step:fail',
      rootTask: root,
      step: deploy,
      result: deployResult,
    });
    render({ kind: 'task:fail', task: root, error: new Error('boom'), steps: [] });

    expect(log).to.eql([
      { kind: 'start', text: runningTaskText('all') },
      { kind: 'text', text: runningStepText('pull:view') },
      { kind: 'succeed', text: okStepText('pull:view', '120ms', width) },
      { kind: 'start', text: runningStepText('deploy:stage') },
      { kind: 'fail', text: failedStepText('deploy:stage', '16ms', width) },
    ]);
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
            use: CaptureTask
            from: ./-tasks/capture.ts
            config: ./-config/capture.yaml
          - name: clean
            use: CleanTask
            from: ./-tasks/clean.ts
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
    expect(text).to.contain('│  use  CaptureTask');
    expect(text).to.contain('│  from ./-tasks/capture.ts');
    expect(text).to.contain('│  config ./-config/capture.yaml');
    expect(text).to.contain('└─ clean');
    expect(text).to.contain('   use  CleanTask');
    expect(text).to.contain('   from ./-tasks/clean.ts');
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

  it('start → renders started service status blocks uniformly', async () => {
    const fs = await Testing.dir('CellCli.start.service-status');
    await Fs.write(
      Fs.join(fs.dir, '-config/@sys.cell/cell.yaml'),
      Str.dedent(`
        kind: cell
        version: 1

        services:
          - name: preview
            use: StatusService
            from: ./-services/status.ts
            config: ./-config/preview.yaml
          - name: api
            use: StatusService
            from: ./-services/status.ts
            config: ./-config/api.yaml
      `).trimStart(),
    );
    await Fs.write(Fs.join(fs.dir, '-services/status.ts'), statusServiceSource());

    const res = await silent(() => CellCli.run({ argv: ['start', fs.dir] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('start');
    if (res.kind !== 'start') throw new Error('expected start result');
    expect(res.services).to.eql(2);
    expect(text.startsWith('\nservice')).to.eql(true);
    expect(text).to.contain('\n\nroot');
    expect(text).to.contain('service');
    expect(text).to.contain('preview');
    expect(text).to.contain('api');
    expect(text).to.contain('module');
    expect(text).to.contain('./-services/status.ts');
    expect(text).to.contain(Fs.join(fs.dir, '-config/preview.yaml'));
    expect(text).to.contain(Fs.join(fs.dir, 'view'));
    expect(text).to.contain('http://127.0.0.1:4321/view/');
    expect(text).to.contain('http://127.0.0.1:4321/payments/');
    expect(text).to.contain('http://127.0.0.1:4321/');
    expect(text).to.not.contain('http://127.0.0.1:4321/view/ path');
    expect(text).to.not.contain('route.payments');
    expect(res.text).to.contain(c.cyan('http://127.0.0.1:4321'));
    expect(res.text.split(c.cyan('http://127.0.0.1:4321')).length - 1).to.eql(2);
    expect(res.text.split(c.gray('http://127.0.0.1:4321')).length - 1).to.eql(4);
    expect(res.text).to.contain(`${c.cyan('http://127.0.0.1:4321')}${c.gray('/')}`);
    expect(res.text).to.contain(c.gray('/view/'));
    expect(res.text).to.not.contain(`${c.cyan('http://127.0.0.1:4321')}${c.gray('/view/')}`);
    expect(res.text).to.not.contain(c.cyan('http://127.0.0.1:4321/view/'));
    expect(text).to.contain('dist');
    expect(text).to.contain('dist/');
    expect(text.indexOf('dist/')).to.be.lessThan(text.indexOf('http://127.0.0.1:4321/view/'));
    expect(text).to.contain('services   2');
    expect(text).to.not.contain('owner-local-name');

    const divider = stripAnsi(c.dim(c.gray(Cli.Fmt.hr())));
    const previewBlock = text.slice(0, text.indexOf(divider));
    expect(serviceUrlsOf(previewBlock)).to.eql([
      'http://127.0.0.1:4321/view/',
      'http://127.0.0.1:4321/payments/',
      'http://127.0.0.1:4321/',
    ]);
    expect(text.split(divider).length - 1).to.eql(1);
    expect(text.indexOf('preview')).to.be.lessThan(text.indexOf(divider));
    expect(text.indexOf(divider)).to.be.lessThan(text.indexOf('api'));
  });

  it('service renderer shows non-default selected service mode', () => {
    const now = Time.now.timestamp;
    const text = stripAnsi(Fmt.Services.started({
      services: [{
        service: {
          name: 'view' as t.Cell.Id,
          use: 'ViteDev',
          from: 'jsr:@sys/driver-vite/service',
          config: './-config/view.dev.yaml' as t.Cell.Path,
        },
        selection: {
          name: 'view' as t.Cell.Id,
          mode: 'dev',
          variant: 'dev' as t.Cell.Id,
          descriptor: {
            name: 'view' as t.Cell.Id,
            use: 'Serve',
            from: 'jsr:@sys/tools/serve',
            config: './-config/view.yaml' as t.Cell.Path,
          },
          binding: {
            use: 'ViteDev',
            from: 'jsr:@sys/driver-vite/service',
            config: './-config/view.dev.yaml' as t.Cell.Path,
          },
        },
        paths: { config: '/cell/-config/view.dev.yaml' as t.StringPath },
        metrics: { start: { startedAt: now, resolvedAt: now } },
      }],
    }));

    expect(text).to.contain('service');
    expect(text).to.contain('view');
    expect(text).to.contain('mode');
    expect(text).to.contain('dev');
    expect(text).to.contain('jsr:@sys/driver-vite/service');
    expect(text).to.not.contain('jsr:@sys/tools/serve');
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

type SpinnerLog = {
  readonly kind: 'start' | 'text' | 'succeed' | 'fail' | 'stop';
  readonly text: string;
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

function statusServiceSource() {
  return Str.dedent(`
    export const StatusService = {
      start() {
        const root = new URL('../view/', import.meta.url).pathname.replace(/\\/$/, '');
        return {
          finished: Promise.resolve('done'),
          close() {},
          status() {
            return {
              state: 'ready',
              name: 'owner-local-name',
              kind: 'fixture',
              root,
              urls: [
                { href: 'http://127.0.0.1:4321/', label: 'root' },
                { href: 'http://127.0.0.1:4321/view/', label: 'path' },
                { href: 'http://127.0.0.1:4321/payments/', label: 'route.payments' },
              ],
              details: [{ label: 'dist', value: 'dist/' }],
            };
          },
        };
      },
    };
  `).trimStart();
}

function serviceUrlsOf(text: string): string[] {
  return text.match(/https?:\/\/\S+/g) ?? [];
}

function runningTaskText(name: string): string {
  return `${Cli.Fmt.spinnerText('running task ', false)}${c.cyan(name)}`;
}

function runningStepText(name: string): string {
  return `${Cli.Fmt.spinnerText('running ', false)}${c.cyan(name)}`;
}

function okStepText(name: string, elapsed: string, width: number): string {
  return stepCompletionText('ok', name, elapsed, width);
}

function failedStepText(name: string, elapsed: string, width: number): string {
  return stepCompletionText('failed', name, elapsed, width);
}

function stepCompletionText(
  status: 'ok' | 'failed',
  name: string,
  elapsed: string,
  width: number,
): string {
  const color = status === 'ok' ? c.green : c.yellow;
  const prefix = `${color(status)} ${c.gray('step')} ${c.white(name)}`;
  const labelWidth = stepCompletionLabel(status, name).length;
  const targetWidth = Math.max(width, labelWidth);
  const pad = ' '.repeat(targetWidth - labelWidth + 2);
  return Cli.Fmt.spinnerRaw(`${prefix}${pad}${c.gray(elapsed)}`, false);
}

function stepCompletionLabelWidth(leaves: Iterable<t.Cell.Task.Leaf>): number {
  let width = 0;
  for (const leaf of leaves) {
    width = Math.max(
      width,
      stepCompletionLabel('ok', leaf.name).length,
      stepCompletionLabel('failed', leaf.name).length,
    );
  }
  return width;
}

function stepCompletionLabel(status: 'ok' | 'failed', name: string): string {
  return `${status} step ${name}`;
}

function fakeSpinner(log: SpinnerLog[]): t.CliSpinner.Lib['start'] {
  return (text = '') => {
    log.push({ kind: 'start', text });
    let value = text;
    let spinner: t.CliSpinner.Instance;
    spinner = {
      get text() {
        return value;
      },
      set text(next: string) {
        value = next;
        log.push({ kind: 'text', text: next });
      },
      start(next = value) {
        value = next;
        log.push({ kind: 'start', text: next });
        return spinner;
      },
      stop() {
        log.push({ kind: 'stop', text: value });
        return spinner;
      },
      succeed(next = value) {
        value = next;
        log.push({ kind: 'succeed', text: next });
        return spinner;
      },
      fail(next = value) {
        value = next;
        log.push({ kind: 'fail', text: next });
        return spinner;
      },
    };
    return spinner;
  };
}

function taskLeafDescriptor(name: string): t.Cell.Task.Leaf {
  return { name, use: 'Task', from: './-tasks/task.ts' };
}

function taskCompositeDescriptor(
  name: string,
  tasks: string[],
): t.Cell.Task.Composite {
  return { name, steps: tasks.map((task) => ({ task })) };
}

function taskStepResult(
  task: t.Cell.Task.Leaf,
  ok = true,
  elapsed = 0,
): t.Cell.Task.StepResult {
  const startedAt = Time.now.timestamp;
  const resolvedAt = startedAt + elapsed;
  const metrics: t.Cell.Task.RunMetrics = { run: { startedAt, resolvedAt } };
  if (ok) return { task, ok: true, result: { ok: true }, metrics };
  return { task, ok: false, error: new Error('boom'), metrics };
}

async function read(path: string) {
  const res = await Fs.readText(path);
  if (!res.ok) throw res.error;
  return res.data ?? '';
}
