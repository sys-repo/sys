import { describe, expect, Fs, it, Str, Testing } from '../../-test.ts';
import { c, Cli, stripAnsi, type t } from '../common.ts';
import { CellCli } from '../mod.ts';
import { Fmt } from '../u.fmt/u.mod.ts';
import { silent, taskEvents } from './u.fixture.ts';

describe(`@sys/cell/cli info`, () => {
  it('info → reports a minimal Cell without probing or mutation', async () => {
    const fs = await Testing.dir('CellCli.info.minimal');
    await Fs.write(Fs.join(fs.dir, '-config/@sys.cell/cell.yaml'), 'kind: cell\nversion: 1\n');
    await Fs.write(Fs.join(fs.dir, 'data/source.txt'), 'source material\n');

    const before = await Fs.exists(Fs.join(fs.dir, 'view'));
    const res = await silent(() => CellCli.run({ argv: ['info', fs.dir] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('info');
    if (res.kind !== 'info') throw new Error('expected info result');
    expect(res.root).to.eql(fs.dir);
    expect(res.descriptor).to.eql('-config/@sys.cell/cell.yaml');
    expect(res.version).to.eql(1);
    expect(text).to.contain('Cell');
    expect(text).to.contain('descriptor');
    expect(text).to.contain('-config/@sys.cell/cell.yaml');
    expect(text).to.contain('version');
    expect(text).to.contain('1');
    expect(text).to.contain('Services');
    expect(text).to.contain('none');
    expect(text).to.contain('Tasks');
    expect(text).to.contain('none');
    expect(res.text).to.contain(c.gray('1'));
    expect(await Fs.exists(Fs.join(fs.dir, 'view'))).to.eql(before);
  });

  it('info → renders declared services and tasks without importing endpoints', async () => {
    const fs = await Testing.dir('CellCli.info.declared');
    await Fs.write(
      Fs.join(fs.dir, '-config/@sys.cell/cell.yaml'),
      Str.dedent(`
        kind: cell
        version: 1

        services:
          - name: view
            use: Serve
            from: '@sys/tools/serve'
            config: ./-config/@sys.tools.serve/view.yaml
            variants:
              dev:
                use: Vite
                from: ./missing-service.ts
                config: ./-config/@sys.tools.serve/view.dev.yaml

        tasks:
          - name: sample:deploy:prep
            use: PrepTask
            from: ./missing-prep.ts
          - name: sample:publish
            use: PublishTask
            from: ./missing-publish.ts
          - name: sample:deploy
            steps:
              - task: sample:deploy:prep
              - task: sample:publish
      `).trimStart(),
    );

    const res = await silent(() => CellCli.run({ argv: ['info', fs.dir] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('info');
    if (res.kind !== 'info') throw new Error('expected info result');
    expect(res.services).to.eql(1);
    expect(res.tasks).to.eql(3);
    expect(text).to.contain('view');
    expect(text).to.contain('use');
    expect(text).to.contain('Serve');
    expect(text).to.contain('from');
    expect(text).to.contain('@sys/tools/serve');
    expect(text).to.contain('config');
    expect(text).to.contain('-config/@sys.tools.serve/view.yaml');
    expect(text).to.contain('modes');
    expect(text).to.contain('dev');
    expect(text).to.contain('sample:deploy:prep');
    expect(text).to.contain('PrepTask');
    expect(text).to.contain('./missing-prep.ts');
    expect(text).to.contain('sample:deploy');
    expect(text).to.contain('steps');
    expect(text).to.contain('sample:deploy:prep → sample:publish');
    expect(taskEvents()).to.eql([]);
  });

  it('formatter → uses stronger labels for Cell facts than nested details', () => {
    const rendered = Fmt.Info.cell({
      root: '.',
      descriptor: '-config/@sys.cell/cell.yaml',
      descriptorPath: '-config/@sys.cell/cell.yaml',
      version: 1,
      services: [{
        name: 'view' as t.Cell.Id,
        use: 'Serve',
        from: 'jsr:@sys/tools/serve',
        config: './-config/@sys.tools.serve/view.yaml' as t.Cell.Path,
      }],
      tasks: [],
    });

    expect(rendered).to.contain(c.gray('root      '));
    expect(rendered).to.not.contain(c.dim(c.gray('root      ')));
    expect(rendered).to.contain(c.dim(c.gray('use       ')));
  });

  it('formatter → uses one shared label column across sections', () => {
    const text = stripAnsi(Fmt.Info.cell({
      root: '.',
      descriptor: '-config/@sys.cell/cell.yaml',
      descriptorPath: '-config/@sys.cell/cell.yaml',
      version: 1,
      services: [{
        name: 'view' as t.Cell.Id,
        use: 'Serve',
        from: 'jsr:@sys/tools/serve',
        config: './-config/@sys.tools.serve/view.yaml' as t.Cell.Path,
      }],
      tasks: [{ name: 'sample:deploy', steps: [{ task: 'sample:publish' as t.Cell.Id }] }],
    }));

    const descriptorColumn = valueColumn(text, 'descriptor');
    expect(valueColumn(text, 'root')).to.eql(descriptorColumn);
    expect(valueColumn(text, 'version')).to.eql(descriptorColumn);

    const itemColumn = descriptorColumn + 2;
    expect(valueColumn(text, 'use')).to.eql(itemColumn);
    expect(valueColumn(text, 'from')).to.eql(itemColumn);
    expect(valueColumn(text, 'config')).to.eql(itemColumn);
    expect(valueColumn(text, 'steps')).to.eql(itemColumn);
  });

  it('formatter → fits path values with the canonical TTY path formatter', () => {
    const restore = stubCliTerminal(42);
    try {
      const rendered = Fmt.Info.cell({
        root: '/sample/workspace/ui-components/dist',
        descriptor: '-config/@sys.cell/cell.yaml',
        descriptorPath: '-config/@sys.cell/cell.yaml',
        version: 1,
        services: [],
        tasks: [],
      });
      const text = stripAnsi(rendered);
      const rootLine = text.split('\n').find((line) => line.trimStart().startsWith('root')) ?? '';

      expect(rootLine.includes('…')).to.eql(true);
      expect(rootLine.length <= 42).to.eql(true);
      expect(rendered).to.contain('…');
    } finally {
      restore();
    }
  });

  it('formatter → highlights inline task arrows in TTY output', () => {
    const restore = stubCliTerminal(80);
    try {
      const rendered = Fmt.Info.cell({
        root: '.',
        descriptor: '-config/@sys.cell/cell.yaml',
        descriptorPath: '-config/@sys.cell/cell.yaml',
        version: 1,
        services: [],
        tasks: [{
          name: 'sample:deploy',
          steps: [
            { task: 'pull:view' as t.Cell.Id },
            { task: 'deploy:prep' as t.Cell.Id },
          ],
        }],
      });

      expect(rendered).to.contain(c.cyan('→'));
      expect(stripAnsi(rendered)).to.contain('pull:view → deploy:prep');
    } finally {
      restore();
    }
  });

  it('formatter → breaks overflowing task steps into a value-aligned chain', () => {
    const restore = stubCliTerminal(34);
    try {
      const rendered = Fmt.Info.cell({
        root: '.',
        descriptor: '-config/@sys.cell/cell.yaml',
        descriptorPath: '-config/@sys.cell/cell.yaml',
        version: 1,
        services: [],
        tasks: [{
          name: 'sample:deploy',
          steps: [
            { task: 'sample:deploy:prep' as t.Cell.Id },
            { task: 'sample:publish:assets' as t.Cell.Id },
            { task: 'sample:publish:cdn' as t.Cell.Id },
          ],
        }],
      });
      const text = stripAnsi(rendered);
      const stepsLine = text.split('\n').find((line) => line.trimStart().startsWith('steps')) ?? '';
      const continuation = text.split('\n').find((line) => line.trimStart().startsWith('→')) ?? '';

      expect(rendered).to.contain(c.cyan('→'));
      expect(rendered).to.contain(c.cyan('…'));
      expect(stepsLine).to.contain('…');
      expect(continuation).to.contain('→');
      expect(stepsLine.length <= 34).to.eql(true);
      expect(continuation.length <= 34).to.eql(true);
    } finally {
      restore();
    }
  });
});

function valueColumn(text: string, label: string): number {
  const line = text.split('\n').find((line) => line.trimStart().startsWith(label));
  expect(line, label).to.not.eql(undefined);
  const start = line?.indexOf(label) ?? 0;
  const after = line?.slice(start + label.length) ?? '';
  const offset = after.search(/\S/);
  expect(offset, label).to.be.greaterThan(-1);
  return start + label.length + offset;
}

function stubCliTerminal(width: number): () => void {
  const screen = Cli.Screen as { size: () => { width: number; height: number } };
  const is = Cli.Is as { terminal: (stream?: t.StdioName) => boolean };
  const prevSize = screen.size;
  const prevTerminal = is.terminal;
  screen.size = () => ({ width, height: 24 });
  is.terminal = () => true;
  return () => {
    screen.size = prevSize;
    is.terminal = prevTerminal;
  };
}
