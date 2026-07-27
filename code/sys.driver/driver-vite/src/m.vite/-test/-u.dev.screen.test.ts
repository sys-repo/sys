import { c, Cli, describe, expect, it, stripAnsi, type t } from '../../-test.ts';
import { DevOutputLog } from '../u/u.dev.output.ts';
import { DevScreen } from '../u/u.dev.screen.ts';
import {
  paths,
  pkg,
  processEvent,
  workspace,
  workspaceWithAliases,
} from './u.fixture.dev-screen.ts';

const HASH = `sha256-${'88f8e3e041df504c3177b35ad742f4aebf99951a0c832fb64c1e1b2edef'}ccd11`;
const STARTING_DEV_SERVER = 'starting dev server…';

describe('DevScreen', () => {
  describe('reporter policy', () => {
    it('normalizes configured visible-log limits', () => {
      expect(DevScreen.logLines(undefined)).to.eql(10);
      expect(DevScreen.logLines('3')).to.eql(3);
      expect(DevScreen.logLines(-1)).to.eql(0);
      expect(DevScreen.logLines(10_000)).to.eql(200);
    });

    it('resolves explicit and automatic modes with raw safety fallbacks', () => {
      expect(DevScreen.resolveReporter('raw', { isInteractive: () => true })).to.eql('raw');
      expect(DevScreen.resolveReporter('screen', { hasPkg: true, isInteractive: () => false })).to
        .eql('screen');
      expect(DevScreen.resolveReporter('screen', { isInteractive: () => true })).to.eql('raw');
      expect(DevScreen.resolveReporter('auto', { hasPkg: true, isInteractive: () => true })).to.eql(
        'screen',
      );
      expect(DevScreen.resolveReporter('auto', { hasPkg: true, isInteractive: () => false })).to
        .eql('raw');
      expect(
        DevScreen.resolveReporter('auto', {
          silent: true,
          hasPkg: true,
          isInteractive: () => true,
        }),
      ).to.eql('raw');
    });
  });

  describe('shared frame constraints', () => {
    it('preserves version before package scope under horizontal pressure', () => {
      const pkgName = '@sys/ui-components';
      const unscoped = 'ui-components';
      const version = '0.0.319';
      const scopedWithVersionWidth = pkgName.length + 1 + version.length;
      const unscopedWithVersionWidth = unscoped.length + 1 + version.length;
      const header = (width: number) =>
        stripAnsi(DevScreen.toString({
          pkg: { name: pkgName, version },
          paths: paths(),
          url: 'http://localhost:1234/',
          lines: [],
          ...frame(width),
        })).split('\n')[0];

      expect(header(scopedWithVersionWidth).startsWith(pkgName)).to.eql(true);
      expect(header(scopedWithVersionWidth).endsWith(version)).to.eql(true);

      const unscopedWithVersion = header(scopedWithVersionWidth - 1);
      expect(unscopedWithVersion.startsWith(unscoped)).to.eql(true);
      expect(unscopedWithVersion.endsWith(version)).to.eql(true);

      expect(header(unscopedWithVersionWidth - 1)).to.eql(pkgName);
      expect(header(pkgName.length - 1)).to.eql(unscoped);

      const tight = header(8);
      expect(Cli.Fmt.Text.Width.measure(tight)).to.eql(8);
      expect(tight).to.not.include('@sys');
      expect(tight).to.include('…');
    });

    it('renders package and version identity in the green header lane', () => {
      const pkgName = '@sys/ui-components';
      const version = '0.0.319';
      const raw = DevScreen.toString({
        pkg: { name: pkgName, version },
        dist: dist(),
        paths: paths(),
        url: 'http://localhost:1234/',
        lines: [],
        ...frame(80, 40),
      });
      const [rawHeader = ''] = raw.split('\n');

      expect(stripAnsi(rawHeader).startsWith(pkgName)).to.eql(true);
      expect(stripAnsi(rawHeader).endsWith(version)).to.eql(true);
      expect(rawHeader).to.include(c.green(c.bold(pkgName)));
      expect(rawHeader).to.include(c.dim(c.green(version)));
    });

    it('middle-ellipsizes URL, input, and output values within the frame width', () => {
      const basePaths = paths();
      const customPaths = {
        ...basePaths,
        app: {
          ...basePaths.app,
          entry: 'src/very/deep/routes/index.html',
          outDir: 'dist/generated/very/deep/pkg',
        },
      };
      const width = 30;
      const text = stripAnsi(DevScreen.toString({
        pkg: pkg(),
        paths: customPaths,
        url: 'http://localhost:12345/',
        lines: [],
        ...frame(width, 40),
      }));
      const rows = text.split('\n');
      const urlLine = rows.find((line) => line.includes('http://')) ?? '';
      const inputLine = rows.find((line) => line.includes('input')) ?? '';
      const outputLine = rows.find((line) => line.includes('output')) ?? '';

      expectRowsBounded(text, width);
      expect(urlLine).to.include('…');
      expect(urlLine).to.include(':12345/');
      expect(inputLine).to.include('src/');
      expect(inputLine).to.include('…');
      expect(inputLine).to.include('.html');
      expect(outputLine).to.include('dist/');
      expect(outputLine).to.include('…');
      expect(outputLine).to.include('/pkg');
    });

    it('bounds every row below the metadata label width', () => {
      const output = DevOutputLog.create({ maxLines: 5 });
      output.push(processEvent('stdout', 'VITE ready in 1234 ms\n'));
      const width = 8;
      const raw = DevScreen.toString({
        pkg: pkg(),
        paths: paths(),
        url: 'http://localhost:12345/',
        lines: output.lines(),
        logLines: 1,
        showOptions: true,
        ...frame(width, 40),
      });

      expectRowsBounded(raw, width);
    });

    it('bounds the complete frame to the supplied terminal height', () => {
      const output = DevOutputLog.create({ maxLines: 5 });
      output.push(processEvent('stdout', 'one\n'));
      output.push(processEvent('stdout', 'two\n'));
      output.push(processEvent('stderr', 'warn\n'));

      const text = stripAnsi(DevScreen.toString({
        pkg: pkg(),
        paths: paths(),
        url: 'http://localhost:1234/',
        lines: output.lines(),
        logLines: 10,
        ...frame(24, 11),
      }));

      expect(text.split('\n').length).to.eql(10);
      expect(text).to.not.include(' out  one');
      expect(text).to.not.include(' out  two');
      expect(text).to.include(' err  warn');
    });

    it('keeps startup and ready output physically bounded in tiny viewports', () => {
      for (const width of [0, 1, 8]) {
        for (const height of [0, 1, 2, 3, 4, 5]) {
          const args = {
            pkg: pkg(),
            paths: paths(),
            url: 'http://localhost:1234/',
            lines: [],
            ...frame(width, height),
          };
          const startup = DevScreen.startupToString({ ...args, spinner: '⠋' });
          const ready = DevScreen.toString(args);

          expect(physicalRows(startup) <= height).to.eql(true);
          expect(physicalRows(ready) <= height).to.eql(true);
          expectRowsBounded(startup, width);
          expectRowsBounded(ready, width);
        }
      }
    });
  });

  describe('ready frame', () => {
    it('renders metadata followed by the configured visible-log tail', () => {
      const output = DevOutputLog.create({ maxLines: 5 });
      output.push(processEvent('stdout', 'one\n'));
      output.push(processEvent('stdout', 'two\n'));
      output.push(processEvent('stderr', 'warn\n'));

      const width = 24;
      const raw = DevScreen.toString({
        pkg: pkg(),
        paths: paths(),
        url: 'http://localhost:1234/',
        lines: output.lines(),
        logLines: 2,
        ...frame(width),
      });
      const text = stripAnsi(raw);
      const rows = text.split('\n');
      const inputRow = rows.findIndex((line) => line.includes('input'));
      const outputRow = rows.findIndex((line) => line.includes('output'));
      const firstLogRow = rows.findIndex((line) => line.includes(' out  two'));

      expectRowsBounded(raw, width);
      expect(inputRow < outputRow).to.eql(true);
      expect(outputRow < firstLogRow).to.eql(true);
      expect(text).to.not.include(' 1  out  one');
      expect(text).to.include(' 2  out  two');
      expect(text).to.include(' 3  err  warn');
    });

    it('contracts and re-expands the visible tail without deleting retained output', () => {
      const output = DevOutputLog.create({ maxLines: 10 });
      for (let index = 1; index <= 5; index++) {
        output.push(processEvent('stdout', `line-${index}\n`));
      }
      const render = (height: number) =>
        stripAnsi(DevScreen.toString({
          pkg: pkg(),
          paths: paths(),
          url: 'http://localhost:1234/',
          lines: output.lines(),
          logLines: 5,
          ...frame(40, height),
        }));

      const short = render(10);
      const medium = render(11);
      const tall = render(13);

      expect(short).to.not.include('line-5');
      expect(medium).to.not.include('line-4');
      expect(medium).to.include('line-5');
      expect(tall).to.not.include('line-2');
      expect(tall).to.include('line-3');
      expect(tall).to.include('line-4');
      expect(tall).to.include('line-5');
      expect(output.lines().map((line) => line.text)).to.eql([
        'line-1',
        'line-2',
        'line-3',
        'line-4',
        'line-5',
      ]);
    });

    it('contracts logs and extended detail before operational options or core metadata', () => {
      const output = DevOutputLog.create({ maxLines: 5 });
      output.push(processEvent('stdout', 'retained-log\n'));
      const ws = workspace(
        Array.from({ length: 10 }, (_, index) => `workspace-${index + 1}`).join('\n'),
      );
      const render = (height: number) =>
        stripAnsi(DevScreen.toString({
          pkg: pkg(),
          paths: paths(),
          url: 'http://localhost:1234/',
          lines: output.lines(),
          logLines: 5,
          showOptions: true,
          ws,
          ...frame(50, height),
        }));

      const short = render(16);
      const medium = render(24);
      const tall = render(35);

      expect(short).to.include('input');
      expect(short).to.include('output');
      expect(short).to.include('options:');
      expect(short).to.not.include('workspace-1');
      expect(short).to.not.include('retained-log');

      expect(medium).to.include('options:');
      expect(medium).to.include('workspace-1');
      expect(medium).to.not.include('workspace-10');
      expect(medium).to.not.include('retained-log');

      expect(tall).to.include('workspace-10');
      expect(tall).to.include('retained-log');
    });

    it('aligns metadata and option keys with widening log indices', () => {
      const output = DevOutputLog.create({ maxLines: 120 });
      for (let current = 1; current <= 100; current++) {
        output.push(processEvent('stdout', `line-${current}\n`));
      }

      const text = stripAnsi(DevScreen.toString({
        pkg: pkg(),
        paths: paths(),
        url: 'http://localhost:1234/',
        lines: output.lines(),
        logLines: 2,
        showOptions: true,
        ...frame(80),
      }));
      const lines = text.split('\n');
      const header = lines[0];
      const urlLine = lines.find((line) => line.includes('http://localhost')) ?? '';
      const inputLine = lines.find((line) => line.includes('input')) ?? '';
      const logLine = lines.find((line) => line.includes('line-100')) ?? '';
      const quitLine = lines.find((line) => line.includes('ctrl + c')) ?? '';
      const moreLine = lines.find((line) => line.includes('shift + i')) ?? '';
      const column = logLine.indexOf('line-100');

      expect(column).to.eql(11);
      expect(header.indexOf('0.0.0')).to.eql(80 - '0.0.0'.length);
      expect(urlLine.indexOf('http://localhost')).to.eql(column);
      expect(inputLine.indexOf('input')).to.eql(column);
      expect(quitLine.indexOf('ctrl + c')).to.eql(column);
      expect(moreLine.indexOf('shift + i')).to.eql(column);
      expect(logLine).to.include(' 100  out  line-100');
    });

    it('degrades digest detail before allowing the output row to overflow', () => {
      const outputLine = (width: number) => {
        const basePaths = paths();
        const customPaths = {
          ...basePaths,
          app: { ...basePaths.app, entry: 'x', outDir: 'dist/' },
        };
        const text = stripAnsi(DevScreen.toString({
          pkg: pkg(),
          dist: dist(),
          paths: customPaths,
          url: 'http://x:1/',
          lines: [],
          ...frame(width, 40),
        }));
        return text.split('\n').find((line) => line.includes('output')) ?? '';
      };

      const full = outputLine(60);
      const algorithm = outputLine(44);
      const short = outputLine(34);
      const none = outputLine(31);

      expect(full).to.include('dist/ ← digest:sha256:#ccd11');
      expect(algorithm).to.include('dist/ ← sha256:#ccd11');
      expect(algorithm).to.not.include('digest:');
      expect(short).to.include('dist/ ← #ccd11');
      expect(short).to.not.include('sha256');
      expect(none).to.include('output   dist/');
      expect(none).to.not.include('←');
      expect(Cli.Fmt.Text.Width.measure(full) <= 60).to.eql(true);
      expect(Cli.Fmt.Text.Width.measure(algorithm) <= 44).to.eql(true);
      expect(Cli.Fmt.Text.Width.measure(short) <= 34).to.eql(true);
      expect(Cli.Fmt.Text.Width.measure(none) <= 31).to.eql(true);
    });

    it('clips log rows to available cells without wrapping', () => {
      const output = DevOutputLog.create({ maxLines: 5 });
      output.push(
        processEvent(
          'stderr',
          'Warning the configuration file "file:///Users/phil/code/org.sys/sys/deno.json" is long\n',
        ),
      );
      output.push(
        processEvent(
          'stdout',
          '2:08:13 pm [vite] (client) page reload ui.react/ui/Prose.Markdown/-spec/common.ts\n',
        ),
      );

      const width = 50;
      const raw = DevScreen.toString({
        pkg: pkg(),
        paths: paths(),
        url: 'http://localhost:1234/',
        lines: output.lines(),
        logLines: 2,
        ...frame(width),
      });
      const rows = stripAnsi(raw).split('\n').filter((line) => /^\s+\d+  (err|out)  /.test(line));

      expect(rows.length).to.eql(2);
      rows.forEach((line) => expect(Cli.Fmt.Text.Width.measure(line) <= width).to.eql(true));
      expect(rows[0]).to.include('…');
      expect(rows[0]).to.include('deno.json');
      expect(raw).to.include(c.gray('…'));
    });

    it('keeps extended workspace import-map rows cell-safe', () => {
      const width = 42;
      const raw = DevScreen.toString({
        pkg: pkg(),
        paths: paths(),
        url: 'http://localhost:1234/',
        lines: [],
        ws: workspaceWithAliases(),
        ...frame(width, 80),
      });
      const mappingRows = stripAnsi(raw).split('\n').filter((line) =>
        line.includes('→') && line.includes('@sys/')
      );
      const [left, right] = (mappingRows[0] ?? '').split('→');

      expectRowsBounded(raw, width);
      expect(mappingRows.length > 0).to.eql(true);
      expect(mappingRows.every((line) => !line.includes('import '))).to.eql(true);
      expect(mappingRows.every((line) => line.includes('  →  '))).to.eql(true);
      expect(left).to.include('…');
      expect(right).to.include('…');
    });

    it('renders options only when requested', () => {
      const width = 30;
      const render = (showOptions: boolean) =>
        stripAnsi(DevScreen.toString({
          pkg: pkg(),
          paths: paths(),
          url: 'http://localhost:1234/',
          lines: [],
          showOptions,
          ...frame(width, 40),
        }));
      const hidden = render(false);
      const visible = render(true);
      const lines = visible.split('\n');
      const closeLine = lines.find((line) => line.startsWith('close')) ?? '';
      const moreLine = lines.find((line) => line.startsWith('more')) ?? '';
      const quitLine = lines.find((line) => line.startsWith('quit')) ?? '';

      expect(hidden).to.not.include('options:');
      expectRowsBounded(visible, width);
      expect(visible).to.include('options:\n' + '┄'.repeat(width));
      expect(closeLine.indexOf('i')).to.eql(9);
      expect(moreLine.indexOf('shift + i')).to.eql(9);
      expect(quitLine.indexOf('ctrl + c')).to.eql(9);
    });
  });

  describe('startup frame', () => {
    it('budgets header, spinner, cursor, metadata, and elastic logs as one physical frame', () => {
      const output = DevOutputLog.create({ maxLines: 5 });
      output.push(processEvent('stdout', 'one\n'));
      output.push(processEvent('stdout', 'two\n'));
      output.push(processEvent('stdout', 'three\n'));
      const render = (height: number) =>
        stripAnsi(DevScreen.startupToString({
          pkg: pkg(),
          paths: paths(),
          url: 'http://localhost:1234/',
          lines: output.lines(),
          logLines: 5,
          spinner: '⠋',
          ...frame(40, height),
        }));

      const short = render(10);
      const medium = render(12);
      const tall = render(13);

      expect(physicalRows(short)).to.eql(10);
      expect(short).to.not.include(' out  one');
      expect(short).to.not.include(' out  three');
      expect(physicalRows(medium)).to.eql(12);
      expect(medium).to.not.include(' out  one');
      expect(medium).to.include(' out  two');
      expect(medium).to.include(' out  three');
      expect(physicalRows(tall)).to.eql(13);
      expect(tall).to.include(' out  one');
      expect(tall).to.include(' out  two');
      expect(tall).to.include(' out  three');
      expect(output.lines().length).to.eql(3);
    });

    it('renders header, spinner, metadata, and truthful parent-owned status rows', () => {
      const output = DevOutputLog.create({ maxLines: 5 });
      output.pushDisplay('stdout', STARTING_DEV_SERVER);
      output.push(processEvent('stdout', 'transforming modules…\n'));
      output.push(processEvent('stderr', 'warning: dependency pre-bundle pending…\n'));

      const width = 50;
      const raw = DevScreen.startupToString({
        pkg: pkg(),
        dist: dist(),
        paths: paths(),
        url: 'http://localhost:1234/',
        lines: output.lines(),
        logLines: 3,
        spinner: '⠋',
        ...frame(width, 40),
      });
      const text = stripAnsi(raw);
      const rows = text.split('\n');

      expectRowsBounded(raw, width);
      expect(rows[0].startsWith('@sys/example')).to.eql(true);
      expect(rows[0].endsWith('0.0.0')).to.eql(true);
      expect(rows[1]).to.eql('━'.repeat(width));
      expect(rows[2]).to.eql('⠋');
      expect(rows[3]).to.include('http://localhost:1234/');
      expect(text).to.include(`\n 1  out  ${STARTING_DEV_SERVER}`);
      expect(text).to.include('\n 2  out  transforming modules…');
      expect(text).to.include('\n 3  err  warning: dependency pre-bundle pending…');
    });

    it('aligns the seeded startup row as output indices widen', () => {
      const output = DevOutputLog.create({ maxLines: 120 });
      output.pushDisplay('stdout', STARTING_DEV_SERVER);
      for (let current = 1; current <= 100; current++) {
        output.push(processEvent('stdout', `line-${current}\n`));
      }

      const text = stripAnsi(DevScreen.startupToString({
        pkg: pkg(),
        paths: paths(),
        url: 'http://localhost:1234/',
        lines: output.lines(),
        logLines: 120,
        spinner: '⠋',
        ...frame(80, 140),
      }));

      expect(text).to.include(`\n   1  out  ${STARTING_DEV_SERVER}`);
      expect(text).to.include('\n 100  out  line-99');
      expect(text).to.include('\n 101  out  line-100');
    });
  });
});

/**
 * Helpers:
 */
function frame(width: number, height = 40) {
  return { viewport: { width, height }, cursorRows: 1 };
}

function physicalRows(text: string) {
  return text ? text.split('\n').length + 1 : 0;
}

function expectRowsBounded(text: string, width: number) {
  text.split('\n').forEach((line) => {
    expect(Cli.Fmt.Text.Width.measure(line) <= width).to.eql(true);
  });
}

function dist(): t.DistPkg {
  return { hash: { digest: HASH, parts: {} } } as t.DistPkg;
}
