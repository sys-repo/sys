import { describe, expect, Fs, it, Str, Testing } from '../../-test.ts';
import { c, Cli, stripAnsi } from '../common.ts';
import { CellCli } from '../mod.ts';
import { formatStartResult, startServicesText } from '../u.start.ts';
import { devServiceSource, serviceUrlsOf, silent, statusServiceSource } from './u.fixture.ts';

describe(`@sys/cell/cli start`, () => {
  it('formats startup spinner text from service count', () => {
    expect(startServicesText(0)).to.eql('starting zero services...');
    expect(startServicesText(1)).to.eql('starting service...');
    expect(startServicesText(3)).to.eql('starting three services...');
    expect(startServicesText(10)).to.eql('starting ten services...');
    expect(startServicesText(11)).to.eql('starting 11 services...');
  });

  it('startup spinner text → shows elapsed only after one second', () => {
    expect(stripAnsi(startServicesText(2, 1000, 1999))).to.eql('starting two services...');
    expect(stripAnsi(startServicesText(2, 1000, 2000))).to.eql('starting two services... 1s');
    expect(stripAnsi(startServicesText(2, 1000, 2500))).to.eql('starting two services... 2s');
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

  it('start summary renderer trims cwd from filesystem paths', () => {
    const cwd = Fs.cwd();
    const root = Fs.join(cwd, '-sample/cell.vite');
    const text = stripAnsi(formatStartResult({
      root,
      services: 1,
      mode: 'default',
      serviceText: '',
    }));

    expect(text).to.contain('-sample/cell.vite');
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
    expect(text).to.contain(Fs.join(fs.dir, 'view'));
    expect(text).to.contain('http://localhost:4321/view/');
    expect(text).to.contain('http://localhost:4321/payments/');
    expect(text).to.contain('http://localhost:4321/');
    const highlightedOrigin = `${c.cyan('http://localhost:')}${c.bold(c.cyan('4321'))}`;
    expect(res.text).to.contain(highlightedOrigin);
    expect(res.text.split(highlightedOrigin).length - 1).to.eql(2);
    expect(res.text.split(c.gray('http://localhost:4321')).length - 1).to.eql(4);
    expect(res.text).to.contain(`${highlightedOrigin}${c.gray('/')}`);
    expect(res.text).to.contain(c.gray('/view/'));
    expect(text).to.contain('dist');
    expect(text).to.contain('dist/');
    expect(text.indexOf('dist/')).to.be.lessThan(text.indexOf('http://localhost:4321/view/'));
    expect(text).to.contain('services   2');

    const divider = stripAnsi(c.dim(c.gray(Cli.Fmt.hr())));
    const previewBlock = text.slice(0, text.indexOf(divider));
    expect(serviceUrlsOf(previewBlock)).to.eql([
      'http://localhost:4321/view/',
      'http://localhost:4321/payments/',
      'http://localhost:4321/',
    ]);
    expect(text.split(divider).length - 1).to.eql(1);
    expect(text.indexOf('preview')).to.be.lessThan(text.indexOf(divider));
    expect(text.indexOf(divider)).to.be.lessThan(text.indexOf('api'));
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
      `).trimStart(),
    );
    await Fs.write(Fs.join(fs.dir, '-services/dev.ts'), devServiceSource());

    const res = await silent(() => CellCli.run({ argv: ['start', fs.dir, '--mode', 'dev'] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('start');
    if (res.kind !== 'start') throw new Error('expected start result');
    expect(res.mode).to.eql('dev');
    expect(res.services).to.eql(1);
    expect(text).to.contain('mode');
    expect(text).to.contain('dev');
    expect(text).to.contain('./-services/dev.ts');
    expect(text).to.contain('services   1');
  });
});
