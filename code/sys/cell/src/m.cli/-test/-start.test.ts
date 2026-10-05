import { describe, expect, Fs, it, Str, type t, Testing } from '../../-test.ts';
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
  it('start → omits identity chrome for an unnamed Cell without caller package metadata', async () => {
    const fs = await Testing.dir('CellCli.start.empty-services');
    await silent(() => CellCli.run({ argv: ['init', fs.dir] }));

    const captured = await captureInfo(() =>
      CellCli.run({ argv: ['start', fs.dir, '--reporter', 'auto'] })
    );
    const res = captured.result;

    expect(res.kind).to.eql('start');
    if (res.kind !== 'start') throw new Error('expected start result');
    expect(res.root).to.eql(fs.dir);
    expect(res.services).to.eql(0);
    expect(res.identity).to.eql(undefined);

    const emitted = stripAnsi(captured.output.join('\n'));
    const returned = stripAnsi(res.text);

    expect(emitted).to.eql(returned);
    expect(emitted.split('\n')[0]?.trimStart().startsWith('root')).to.eql(true);
    expect(emitted).not.to.contain('Untitled');
    expect(emitted).not.to.contain('@sys/cell');
    expect(hasHeaderRule(emitted)).to.eql(false);
  });

  it('start → renders all descriptor and caller package identity combinations', async () => {
    const callerPkg: t.Pkg = { name: '@sys/ui', version: '0.0.39' };
    const cases: readonly {
      label: string;
      name?: t.Cell.Id;
      pkg?: t.Pkg;
      title?: string;
      version?: string;
    }[] = [
      {
        label: 'named-package',
        name: 'sys.ui',
        pkg: callerPkg,
        title: 'sys.ui',
        version: '0.0.39',
      },
      { label: 'named', name: 'sys.ui', title: 'sys.ui' },
      { label: 'package', pkg: callerPkg, title: '@sys/ui', version: '0.0.39' },
      { label: 'anonymous' },
    ];

    for (const item of cases) {
      const fs = await Testing.dir(`CellCli.start.identity.${item.label}`);
      await silent(() => CellCli.run({ argv: ['init', fs.dir] }));
      if (item.name) {
        await Fs.write(
          Fs.join(fs.dir, '-config/@sys.cell/cell.yaml'),
          `kind: cell\nversion: 1\nname: ${item.name}\n`,
        );
      }

      const input: t.CellCli.Input = {
        argv: ['start', fs.dir, '--reporter', 'raw'],
        ...(item.pkg ? { pkg: item.pkg } : {}),
      };
      const captured = await captureInfo(() => CellCli.run(input));
      const res = captured.result;

      expect(res.kind).to.eql('start');
      if (res.kind !== 'start') throw new Error('expected start result');
      expect(res.input.pkg).to.equal(input.pkg);
      expect(res.identity).to.eql(
        item.title
          ? { name: item.title, ...(item.version ? { version: item.version } : {}) }
          : undefined,
      );

      const text = stripAnsi(captured.output.join('\n'));
      expect(text).to.eql(stripAnsi(res.text));
      expect(text).not.to.contain('@sys/cell');
      expect(text).not.to.contain('Untitled');
      expect(hasHeaderRule(text)).to.eql(Boolean(item.title));
      if (item.title) {
        expect(text.split('\n')[0]?.startsWith(item.title)).to.eql(true);
        if (item.version) expect(text.split('\n')[0]?.endsWith(item.version)).to.eql(true);
      } else {
        expect(text.split('\n')[0]?.trimStart().startsWith('root')).to.eql(true);
      }
    }
  });

  it('start → preserves caller package context through validation failures', async () => {
    const callerPkg: t.Pkg = { name: '@sys/ui', version: '0.0.39' };
    const res = await silent(() => CellCli.run({ argv: ['start', '--dry-run'], pkg: callerPkg }));

    expect(res.kind).to.eql('error');
    expect(res.input.pkg).to.equal(callerPkg);
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

    const captured = await captureInfo(() =>
      CellCli.run({ argv: ['start', fs.dir, '--reporter', 'raw'] })
    );
    const res = captured.result;

    expect(res.kind).to.eql('start');
    if (res.kind !== 'start') throw new Error('expected start result');
    expect(res.root).to.eql(fs.dir);
    expect(res.services).to.eql(2);

    const raw = captured.output.join('\n');
    const emitted = stripAnsi(raw);
    const returned = stripAnsi(res.text);
    const lines = emitted.split('\n');
    const returnedLines = returned.split('\n');
    const service = lines.findIndex((line) => line.trimStart().startsWith('service'));
    const returnedService = returnedLines.findIndex((line) =>
      line.trimStart().startsWith('service')
    );
    const module = lines.find((line) => line.trimStart().startsWith('module')) ?? '';
    const url = lines.find((line) => line.trimStart().startsWith('url')) ?? '';
    const continuation =
      lines.find((line) => line.trimStart().startsWith('http://localhost:4321/view/')) ?? '';
    const divider = lines.find((line) => line.trimStart().startsWith('┄')) ?? '';
    const returnedDivider = returnedLines.find((line) => line.trimStart().startsWith('┄')) ?? '';
    const summaryRoot = lines.find((line) => line.startsWith('root')) ?? '';
    const returnedSummaryRoot = returnedLines.find((line) => line.startsWith('root')) ?? '';

    expect(raw).not.to.contain('\x1b]8;;');
    expect(emitted).to.eql(returned);
    expect(res.identity).to.eql(undefined);
    expect(emitted).not.to.contain('@sys/cell');
    expect(emitted).not.to.contain('Untitled');
    expect(hasHeaderRule(emitted)).to.eql(false);
    expect(service).to.eql(0);
    expect(returnedService).to.eql(0);
    expect(indentOf(lines[service])).to.eql(2);
    expect(returnedLines[returnedService]).to.eql(lines[service]);
    expect(indentOf(module)).to.eql(indentOf(lines[service]) + 1);
    expect(indentOf(url)).to.eql(indentOf(lines[service]) + 1);
    expect(continuation.startsWith('  ')).to.eql(true);
    expect(url.indexOf('http://localhost:4321/')).to.eql(
      continuation.indexOf('http://localhost:4321/view/'),
    );
    expect(divider.startsWith('  ┄')).to.eql(true);
    expect(returnedDivider).to.eql(divider);
    const serviceRows = lines.filter((line) => line.startsWith('  ') && !line.includes('┄'));
    const expectedWidth = Cli.Is.terminal('stdout')
      ? Cli.Fmt.Text.Width.fit() - 2
      : Cli.Fmt.Text.Width.max(serviceRows);
    expect(Cli.Fmt.Text.Width.measure(divider)).to.eql(expectedWidth);
    expect(summaryRoot.startsWith('root')).to.eql(true);
    expect(returnedSummaryRoot).to.eql(summaryRoot);
    const names = serviceRows.flatMap((line) => {
      const match = /^\s+service\s+(.+)$/.exec(line);
      return match ? [match[1]] : [];
    });
    expect(names).to.eql(['preview', 'api']);
    const lastBodyRow = lines.findLastIndex((line) => line.startsWith('  '));
    expect(lines.indexOf(summaryRoot)).to.be.greaterThan(lastBodyRow);
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

    const callerPkg: t.Pkg = { name: '@sys/ui', version: '0.0.39' };
    const res = await silent(() => CellCli.run({ argv: ['start', fs.dir], pkg: callerPkg }));

    expect(res.kind).to.eql('error');
    expect(res.input.pkg).to.equal(callerPkg);
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

/**
 * Helpers:
 */
async function captureInfo<T>(fn: () => Promise<T>) {
  const info = console.info;
  const output: string[] = [];
  console.info = (value) => {
    output.push(String(value));
  };

  try {
    return { result: await fn(), output } as const;
  } finally {
    console.info = info;
  }
}

function hasHeaderRule(text: string): boolean {
  return text.split('\n').some((line) =>
    line.length > 0 && [...line].every((char) => char === '━')
  );
}

function indentOf(line: string): number {
  return line.length - line.trimStart().length;
}
