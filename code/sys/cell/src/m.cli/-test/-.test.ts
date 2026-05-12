import { describe, expect, Fs, it, Str, Testing } from '../../-test.ts';
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
    expect(text).to.contain('@sys/cell');
    expect(text).to.contain(guidance.summary.split('\n')[0]);
    guidance.usage.forEach((line) => expect(text).to.contain(line));
    guidance.commands.forEach(([name, detail]) => {
      expect(text).to.contain(name);
      expect(text).to.contain(detail);
    });
    expect(text).to.contain('Run `dsl` first before changing Cell config');
    expect(text).to.contain(
      'run first — maps Cell acts, owner rules, actions, services, and chapters',
    );
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

  it('action -h → shows resource-backed action help', async () => {
    const res = await silent(() => CellCli.run({ argv: ['action', '-h'] }));
    const text = stripAnsi(res.text);
    const guidance = await CellHelp.Action.load();

    expect(res.kind).to.eql('help');
    expect(text).to.contain('@sys/cell action');
    guidance.usage.forEach((line) => expect(text).to.contain(line));
    guidance.action.forEach((line) => expect(text).to.contain(line));
    expect(text).to.contain('Cell verifies actions declared in `actions[]`');
    expect(text).to.contain('structured args');
    expect(text).to.not.contain('--agent');
    expect(text).to.not.contain('--dry-run');
  });

  it('start -h → shows resource-backed start help', async () => {
    const res = await silent(() => CellCli.run({ argv: ['start', '-h'] }));
    const text = stripAnsi(res.text);
    const guidance = await CellHelp.Start.load();

    expect(res.kind).to.eql('help');
    expect(text).to.contain('@sys/cell start');
    guidance.usage.forEach((line) => expect(text).to.contain(line));
    guidance.runtime.forEach((line) => expect(text).to.contain(line));
    expect(text).to.contain('Cell.Runtime.wait');
    expect(text).to.contain('started handle with `finished`');
    expect(text).to.not.contain('--agent');
    expect(text).to.not.contain('--dry-run');
  });

  it('help topics are not commands in the greenfield CLI grammar', async () => {
    const res = await silent(() => CellCli.run({ argv: ['help', 'init'] }));

    expect(res.kind).to.eql('error');
    expect(res.text).to.contain('Unknown command: help');
  });

  it('--format is scoped to dsl only', async () => {
    const root = stripAnsi((await silent(() => CellCli.run({ argv: ['--format', 'skill'] }))).text);
    const init = stripAnsi(
      (await silent(() => CellCli.run({ argv: ['init', '--format', 'skill'] }))).text,
    );
    const action = stripAnsi(
      (await silent(() => CellCli.run({ argv: ['action', '--format', 'skill'] }))).text,
    );
    const start = stripAnsi(
      (await silent(() => CellCli.run({ argv: ['start', '--format', 'skill'] }))).text,
    );

    expect(root).to.contain('Unexpected option without command: --format');
    expect(root).to.contain('@sys/cell');
    expect(init).to.contain('Unexpected option for init: --format');
    expect(init).to.contain('@sys/cell init');
    expect(action).to.contain('Unexpected option for action: --format');
    expect(action).to.contain('@sys/cell action');
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

  it('action → runs a named finite action', async () => {
    resetActionEvents();
    const fs = await Testing.dir('CellCli.action.run');
    await Fs.write(
      Fs.join(fs.dir, '-config/@sys.cell/cell.yaml'),
      Str.dedent(`
        kind: cell
        version: 1

        actions:
          - name: capture
            from: ./-actions/capture.ts
            export: CaptureAction
            config: ./-config/capture.yaml
      `).trimStart(),
    );
    await Fs.write(Fs.join(fs.dir, '-config/capture.yaml'), `value: from-config\n`);
    await Fs.write(Fs.join(fs.dir, '-actions/capture.ts'), actionSource('CaptureAction'));

    const res = await silent(() => CellCli.run({ argv: ['action', 'capture', fs.dir] }));
    const text = stripAnsi(res.text);
    const event = actionEvents()[0];

    expect(res.kind).to.eql('action');
    if (res.kind !== 'action') throw new Error('expected action result');
    expect(res.root).to.eql(fs.dir);
    expect(res.action).to.eql('capture');
    expect(res.steps).to.eql(1);
    expect(text).to.contain(`root     ${fs.dir}`);
    expect(text).to.contain('action   capture');
    expect(text).to.contain('steps    1');
    expect(text).to.contain('ok       capture');
    expect(event.args.cwd).to.eql(fs.dir);
    expect(event.args.config).to.eql({ value: 'from-config' });
    expect(event.args.paths.config).to.eql(Fs.join(fs.dir, '-config/capture.yaml'));
  });

  it('start → loads and starts an empty Cell runtime', async () => {
    const fs = await Testing.dir('CellCli.start.empty-runtime');
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

  it('action → rejects missing names, unsupported options, and extra args', async () => {
    const missing = stripAnsi(
      (await silent(() => CellCli.run({ argv: ['action'] }))).text,
    );
    const help = stripAnsi(
      (await silent(() => CellCli.run({ argv: ['action', '--dry-run'] }))).text,
    );
    const extra = stripAnsi(
      (await silent(() => CellCli.run({ argv: ['action', 'capture', '.', 'extra'] }))).text,
    );

    expect(missing).to.contain('Missing action name.');
    expect(missing).to.contain('@sys/cell action');
    expect(help).to.contain('Unexpected option for action: --dry-run');
    expect(help).to.contain('@sys/cell action');
    expect(extra).to.contain('Unexpected argument: extra');
    expect(extra).to.contain('@sys/cell action');
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
type ActionEvent = {
  readonly args: {
    readonly cwd: string;
    readonly config?: Record<string, unknown>;
    readonly paths: { readonly config?: string };
  };
};

type ActionGlobal = typeof globalThis & { __cellCliActionEvents?: ActionEvent[] };

function resetActionEvents() {
  (globalThis as ActionGlobal).__cellCliActionEvents = [];
}

function actionEvents(): readonly ActionEvent[] {
  return (globalThis as ActionGlobal).__cellCliActionEvents ?? [];
}

function actionSource(exportName: string) {
  return Str.dedent(`
    export const ${exportName} = {
      run(args: unknown) {
        const g = globalThis as unknown as { __cellCliActionEvents?: unknown[] };
        g.__cellCliActionEvents ??= [];
        g.__cellCliActionEvents.push({ args });
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
