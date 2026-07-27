import { c, Cli, describe, expect, it, stripAnsi, type t } from '../../-test.ts';
import { DevOutputLog } from '../u/u.dev.output.ts';
import { DevScreen } from '../u/u.dev.screen.ts';
import { paths, pkg, processEvent, workspaceWithAliases } from './u.fixture.dev-screen.ts';

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
          width,
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
        width: 80,
        height: 40,
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
        width,
        height: 40,
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
        width,
        height: 40,
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
        width: 24,
        height: 11,
      }));

      expect(text.split('\n').length).to.eql(11);
      expect(text).to.not.include(' out  one');
      expect(text).to.include(' out  two');
      expect(text).to.include(' err  warn');
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
        width,
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
        width: 80,
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
          width,
          height: 40,
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
        width,
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
        width,
        height: 80,
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
          width,
          height: 40,
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
        width,
        height: 40,
        spinner: '⠋',
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
        width: 80,
        height: 140,
        spinner: '⠋',
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
function expectRowsBounded(text: string, width: number) {
  text.split('\n').forEach((line) => {
    expect(Cli.Fmt.Text.Width.measure(line) <= width).to.eql(true);
  });
}

function dist(): t.DistPkg {
  return { hash: { digest: HASH, parts: {} } } as t.DistPkg;
}
