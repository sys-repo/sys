import { FakeSpinner } from '@sys/cli/testing';
import { describe, expect, Fs, it, pkg, Str, Testing } from '../../-test.ts';
import { Cli, stripAnsi } from '../common.ts';
import { CellCli } from '../mod.ts';
import {
  addressInUseServiceSource,
  devServiceSource,
  failingServiceSource,
  objectCauseServiceSource,
  silent,
  statusServiceSource,
} from './u.fixture.ts';

describe(`@sys/cell/cli start`, () => {
  it('start → frames an empty service set without duplicating the header', async () => {
    const fs = await Testing.dir('CellCli.start.empty-services');
    await silent(() => CellCli.run({ argv: ['init', fs.dir] }));

    const captured = await captureInfo(() => CellCli.run({ argv: ['start', fs.dir] }));
    const res = captured.result;

    expect(res.kind).to.eql('start');
    if (res.kind !== 'start') throw new Error('expected start result');
    expect(res.root).to.eql(fs.dir);
    expect(res.services).to.eql(0);

    const emitted = stripAnsi(captured.output.join('\n'));
    const returned = stripAnsi(res.text);
    const emittedLines = emitted.split('\n');
    const returnedLines = returned.split('\n');
    const emittedRoot = emittedLines.findIndex((line) => line.trimStart().startsWith('root'));
    const returnedRoot = returnedLines.findIndex((line) => line.trimStart().startsWith('root'));

    expect(countTitleRows(emitted)).to.eql(1);
    expect(countTitleRows(returned)).to.eql(1);
    expect(emittedLines[2]).to.eql('');
    expect(returnedLines[2]).to.eql('');
    expect(emittedRoot).to.eql(3);
    expect(returnedRoot).to.eql(3);
  });

  it('start → starts all services within one ordered application frame', async () => {
    const fs = await Testing.dir('CellCli.start.services');
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

    const captured = await captureStartEffects(() => CellCli.run({ argv: ['start', fs.dir] }));
    const res = captured.result;

    expect(res.kind).to.eql('start');
    if (res.kind !== 'start') throw new Error('expected start result');
    expect(res.root).to.eql(fs.dir);
    expect(res.services).to.eql(2);

    const emitted = stripAnsi(captured.output.join('\n'));
    const returned = stripAnsi(res.text);
    const lines = emitted.split('\n');
    const returnedLines = returned.split('\n');
    const title = lines[0];
    const hr = lines[1];
    const service = lines.findIndex((line) => line.trimStart().startsWith('service'));
    const returnedService = returnedLines.findIndex((line) =>
      line.trimStart().startsWith('service')
    );

    expect(captured.effects).to.eql([
      'print',
      'spinner:start',
      'spinner:stop',
      'print',
      'print',
    ]);
    expect(title.startsWith(pkg.name)).to.eql(true);
    expect(title.endsWith(pkg.version)).to.eql(true);
    expect(Cli.Fmt.Text.Width.measure(title)).to.eql(Cli.Fmt.Text.Width.measure(hr));
    expect(hr).to.eql('━'.repeat(Cli.Fmt.Text.Width.measure(hr)));
    expect(lines[2]).to.eql('');
    expect(returnedLines[2]).to.eql('');
    expect(service).to.eql(3);
    expect(returnedService).to.eql(3);
    expect(countTitleRows(emitted)).to.eql(1);
    expect(countTitleRows(returned)).to.eql(1);
    expect(returned).to.contain('preview');
    expect(returned).to.contain('api');
  });

  it('start --mode → starts selected service variants', async () => {
    const fs = await Testing.dir('CellCli.start.mode');
    await Fs.write(
      Fs.join(fs.dir, '-config/@sys.cell/cell.yaml'),
      Str.dedent(`
        kind: cell
        version: 1

        services:
          - name: view
            use: BaseService
            from: npm:untrusted-base
            config: ./-config/view.yaml
            variants:
              dev:
                use: DevService
                from: ./-services/dev.ts
                config: ./-config/view.dev.yaml
      `),
    );
    await Fs.write(Fs.join(fs.dir, '-services/dev.ts'), devServiceSource());

    const res = await silent(() => CellCli.run({ argv: ['start', fs.dir, '--mode', 'dev'] }));

    expect(res.kind).to.eql('start');
    if (res.kind === 'start') {
      expect(res.mode).to.eql('dev');
      expect(res.services).to.eql(1);
    }
  });

  it('start port conflict → reports the service-start address from the cause chain', async () => {
    const fs = await Testing.dir('CellCli.start.port-conflict-cause');
    await Fs.write(
      Fs.join(fs.dir, '-config/@sys.cell/cell.yaml'),
      Str.dedent(`
        kind: cell
        version: 1

        services:
          - name: view
            use: AddressInUseService
            from: ./-services/address-in-use.ts
            config: ./-config/view.yaml
      `).trimStart(),
    );
    await Fs.write(Fs.join(fs.dir, '-services/address-in-use.ts'), addressInUseServiceSource());

    const res = await silent(() => CellCli.run({ argv: ['start', fs.dir] }));

    expect(res.kind).to.eql('error');
    expect(res.text).to.contain("Cell.Services.start: failed to start service 'view'.");
    expect(res.text).to.contain(
      'Cause: Error: WebSocketServer.create: address already in use: 127.0.0.1:5050.',
    );
    expect(res.text).to.contain('Cause: AddrInUse: Address already in use (os error 48)');
  });

  it('start failure → reports the service-start cause chain', async () => {
    const fs = await Testing.dir('CellCli.start.failure-cause');
    await Fs.write(
      Fs.join(fs.dir, '-config/@sys.cell/cell.yaml'),
      Str.dedent(`
        kind: cell
        version: 1

        services:
          - name: view
            use: FailingService
            from: ./-services/failing.ts
            config: ./-config/view.yaml
      `).trimStart(),
    );
    await Fs.write(Fs.join(fs.dir, '-services/failing.ts'), failingServiceSource());

    const res = await silent(() => CellCli.run({ argv: ['start', fs.dir] }));

    expect(res.kind).to.eql('error');
    expect(res.text).to.contain("Cell.Services.start: failed to start service 'view'.");
    expect(res.text).to.contain('Cause: Error: Address already in use (os error 48)');
  });

  it('start failure → renders object causes without leaking arbitrary fields', async () => {
    const fs = await Testing.dir('CellCli.start.object-cause');
    await Fs.write(
      Fs.join(fs.dir, '-config/@sys.cell/cell.yaml'),
      Str.dedent(`
        kind: cell
        version: 1

        services:
          - name: view
            use: ObjectCauseService
            from: ./-services/object-cause.ts
            config: ./-config/view.yaml
      `).trimStart(),
    );
    await Fs.write(Fs.join(fs.dir, '-services/object-cause.ts'), objectCauseServiceSource());

    const res = await silent(() => CellCli.run({ argv: ['start', fs.dir] }));

    expect(res.kind).to.eql('error');
    expect(res.text).to.contain("Cell.Services.start: failed to start service 'view'.");
    expect(res.text).to.contain('Cause: Error: Strict dev port failed');
    expect(res.text).to.contain('Cause: Object (code=EADDRINUSE, port=1234)');
    expect(res.text).not.to.contain('/tmp/private');
    expect(res.text).not.to.contain('[object Object]');
  });
});

type StartEffect = 'print' | 'spinner:start' | 'spinner:stop';

/**
 * Helpers:
 */
async function captureStartEffects<T>(fn: () => Promise<T>) {
  const effects: StartEffect[] = [];
  const spinner = FakeSpinner.create();
  const start = spinner.start;
  const stop = spinner.stop;

  spinner.start = (text) => {
    effects.push('spinner:start');
    return start(text);
  };
  spinner.stop = () => {
    effects.push('spinner:stop');
    return stop();
  };

  using _spinnerStub = FakeSpinner.stub({ spinner });
  const restoreTerminal = stubCliTerminal();
  try {
    const captured = await captureInfo(fn, () => effects.push('print'));
    return { ...captured, effects } as const;
  } finally {
    restoreTerminal();
  }
}

async function captureInfo<T>(fn: () => Promise<T>, onInfo?: (text: string) => void) {
  const info = console.info;
  const output: string[] = [];
  console.info = (value) => {
    const text = String(value);
    output.push(text);
    onInfo?.(text);
  };

  try {
    return { result: await fn(), output } as const;
  } finally {
    console.info = info;
  }
}

function stubCliTerminal(): () => void {
  const is = Cli.Is as { terminal: typeof Cli.Is.terminal };
  const terminal = is.terminal;
  is.terminal = () => true;
  return () => {
    is.terminal = terminal;
  };
}

function countTitleRows(text: string): number {
  return text.split('\n').filter((line) => line.startsWith(pkg.name)).length;
}
