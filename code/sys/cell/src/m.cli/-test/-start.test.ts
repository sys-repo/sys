import { describe, expect, Fs, it, Str, Testing } from '../../-test.ts';
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
  it('start → loads and starts an empty Cell services set', async () => {
    const fs = await Testing.dir('CellCli.start.empty-services');
    await silent(() => CellCli.run({ argv: ['init', fs.dir] }));

    const res = await silent(() => CellCli.run({ argv: ['start', fs.dir] }));

    expect(res.kind).to.eql('start');
    if (res.kind !== 'start') throw new Error('expected start result');
    expect(res.root).to.eql(fs.dir);
    expect(res.services).to.eql(0);
  });

  it('start → starts all declared services', async () => {
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

    const res = await silent(() => CellCli.run({ argv: ['start', fs.dir] }));

    expect(res.kind).to.eql('start');
    if (res.kind !== 'start') throw new Error('expected start result');
    expect(res.root).to.eql(fs.dir);
    expect(res.services).to.eql(2);
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
