import { describe, expect, Fs, it, Str, Testing } from '../../-test.ts';
import { CellCli } from '../mod.ts';
import { devServiceSource, silent, statusServiceSource } from './u.fixture.ts';

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
});
