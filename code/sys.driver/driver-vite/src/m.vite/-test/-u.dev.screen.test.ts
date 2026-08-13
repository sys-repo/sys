import { c, Cli, describe, expect, it, stripAnsi, type t, Time } from '../../-test.ts';
import { DevOutputLog } from '../u/u.dev.output.ts';
import { DevScreen } from '../u/u.dev.screen.ts';
import { paths, pkg, processEvent } from './u.fixture.dev.ts';

const HASH = `sha256-${'88f8e3e041df504c3177b35ad742f4aebf99951a0c832fb64c1e1b2edef'}ccd11`;
const RENDERED_AT = 1_750_000_000_000 as t.UnixTimestamp;
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
          identity: { name: pkgName, version },
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

    it('uses the shared green application header in startup and ready frames', () => {
      const pkgName = '@sys/ui-components';
      const version = '0.0.319';
      const packageInfo = { name: pkgName, version };
      const width = 80;
      const args = {
        identity: packageInfo,
        dist: dist(),
        paths: paths(),
        url: 'http://localhost:1234/',
        lines: [],
        ...frame(width, 40),
      };
      const ready = DevScreen.toString(args);
      const startup = DevScreen.startupToString({ ...args, spinner: '⠋' });
      const expectedHeaderRows = Cli.Fmt.Header.rows({ pkg: packageInfo, width, tone: 'green' });
      const [rawHeader = ''] = ready.split('\n');

      expect(ready.split('\n').slice(0, 2)).to.eql(expectedHeaderRows);
      expect(startup.split('\n').slice(0, 2)).to.eql(expectedHeaderRows);
      expect(stripAnsi(rawHeader).startsWith(pkgName)).to.eql(true);
      expect(stripAnsi(rawHeader).endsWith(version)).to.eql(true);
      expect(rawHeader).to.include(c.bold(c.green(pkgName)));
      expect(rawHeader).to.include(c.dim(c.green(version)));
    });

    it('formats service URLs through the canonical CLI formatter', () => {
      const href = 'http://127.0.0.1:1234/';
      const expected = Cli.Fmt.ServiceUrl.format(
        { href: href as t.StringUrl },
        { origin: 'highlight' },
      );
      const raw = DevScreen.toString({
        identity: pkg(),
        paths: paths(),
        url: href,
        lines: [],
        ...frame(80),
      });

      expect(raw).to.include(expected);
      expect(stripAnsi(raw)).to.include(stripAnsi(expected));
    });

    it('renders one compound identity across startup, ready, and width pressure', () => {
      const packageName = '@sys/driver-pi';
      const subpath = 'ui/preview';
      const identity = { root: { name: packageName, version: '0.0.128' }, subpath };
      const render = (width: number) => {
        const args = {
          identity,
          paths: paths(),
          url: 'http://localhost:1234/',
          lines: [],
          ...frame(width),
        };
        return {
          ready: DevScreen.toString(args).split('\n')[0] ?? '',
          startup: DevScreen.startupToString({ ...args, spinner: '⠋' }).split('\n')[0] ?? '',
        };
      };

      const wide = render(80);
      const tight = render(18);
      const styled = `${c.bold(c.green(packageName))}${c.dim(c.green(`/${subpath}`))}`;
      expect(wide.ready).to.include(styled);
      expect(wide.startup).to.eql(wide.ready);
      expect(stripAnsi(wide.ready).startsWith(`${packageName}/${subpath}`)).to.eql(true);
      expect(tight.startup).to.eql(tight.ready);
      expect(Cli.Fmt.Text.Width.measure(tight.ready)).to.eql(18);
      expect(stripAnsi(tight.ready)).to.include('preview');
      expect(tight.ready).to.include(c.dim(c.green('/preview')));
    });

    it('uses compact rail space before middle-ellipsizing metadata values', () => {
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
        identity: pkg(),
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
      expect(urlLine.trim()).to.eql('http://localhost:12345/');
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
        identity: pkg(),
        paths: paths(),
        url: 'http://localhost:12345/',
        lines: output.lines(),
        logLines: 1,
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
        identity: pkg(),
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
            identity: pkg(),
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
        identity: pkg(),
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

    it('replaces producer ANSI with the renderer-owned white payload tone', () => {
      const producerTone = c.yellow(c.bold('UNPINNED'));
      const raw = DevScreen.toString({
        identity: pkg(),
        paths: paths(),
        url: 'http://localhost:1234/',
        lines: [{ sequence: 1, source: 'stdout', text: producerTone }],
        logLines: 1,
        ...frame(120),
      });
      const outputRow = raw.split('\n').find((line) => stripAnsi(line).includes('UNPINNED'));

      expect(outputRow).to.include(c.gray('1'));
      expect(outputRow).to.include(c.gray('out'));
      expect(outputRow).to.include(c.white('UNPINNED'));
      expect(outputRow).to.not.include(producerTone);
    });

    it('contracts and re-expands the visible tail without deleting retained output', () => {
      const output = DevOutputLog.create({ maxLines: 10 });
      for (let index = 1; index <= 5; index++) {
        output.push(processEvent('stdout', `line-${index}\n`));
      }
      const render = (height: number) =>
        stripAnsi(DevScreen.toString({
          identity: pkg(),
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

    it('switches the complete metadata rail at the narrow-width boundary', () => {
      for (const sequence of [1, 10, 100]) {
        for (const width of [79, 80, 81]) {
          const source: t.Process.StdStream = 'stdout';
          const args = {
            identity: pkg(),
            paths: paths(),
            url: 'http://localhost:1234/',
            lines: [{ sequence, source, text: `line-${sequence}` }],
            logLines: 1,
            ...frame(width),
          };
          const ready = stripAnsi(DevScreen.toString(args));
          const startup = stripAnsi(DevScreen.startupToString({ ...args, spinner: '⠋' }));
          const readyLines = ready.split('\n');
          const logLine = readyLines.find((line) => line.includes(`line-${sequence}`)) ?? '';
          const sourceColumn = logLine.indexOf('out');
          const contentColumn = logLine.indexOf(`line-${sequence}`);
          const metadataColumn = width <= 80 ? sourceColumn : contentColumn;

          for (const text of [ready, startup]) {
            const lines = text.split('\n');
            const urlLine = lines.find((line) => line.includes('http://localhost')) ?? '';
            const arrowLine = lines.find((line) => line.trim() === '↑') ?? '';
            const inputLine = lines.find((line) => line.includes('input')) ?? '';
            const outputLine = lines.find((line) => line.includes('output')) ?? '';

            expectRowsBounded(text, width);
            expect(urlLine.indexOf('http://localhost')).to.eql(metadataColumn);
            expect(arrowLine.indexOf('↑')).to.eql(metadataColumn);
            expect(inputLine.indexOf('input')).to.eql(metadataColumn);
            expect(outputLine.indexOf('output')).to.eql(metadataColumn);
          }

          expect(logLine).to.eql(` ${sequence}  out  line-${sequence}`);
          expect(readyLines[0].indexOf('0.0.0')).to.eql(width - '0.0.0'.length);
        }
      }
    });

    it('qualifies every visible digest variant with build age', () => {
      const outputLine = (width: number, includeDist = true) => {
        const basePaths = paths();
        const customPaths = {
          ...basePaths,
          app: { ...basePaths.app, entry: 'x', outDir: 'dist/' },
        };
        const raw = DevScreen.toString({
          identity: pkg(),
          dist: includeDist ? dist() : undefined,
          paths: customPaths,
          url: 'http://x:1/',
          lines: [],
          ...frame(width, 40),
        });
        return raw.split('\n').find((line) => stripAnsi(line).includes('output')) ?? '';
      };

      const fullRaw = outputLine(60);
      const full = stripAnsi(fullRaw);
      const algorithm = stripAnsi(outputLine(44));
      const short = stripAnsi(outputLine(37));
      const none = stripAnsi(outputLine(31));
      const missing = stripAnsi(outputLine(60, false));

      expect(full).to.include('dist/ ← digest:sha256:#ccd11 · 3d');
      expect(fullRaw).to.include(c.dim(c.gray('· 3d')));
      expect(algorithm).to.include('dist/ ← sha256:#ccd11 · 3d');
      expect(algorithm).to.not.include('digest:');
      expect(short).to.include('dist/ ← #ccd11 · 3d');
      expect(short).to.not.include('sha256');
      expect(none).to.include('output   dist/');
      expect(none).to.not.include('←');
      expect(missing).to.include('output   dist/');
      expect(missing).to.not.include('←');
      expect(missing).to.not.include('·');
      expect(Cli.Fmt.Text.Width.measure(full) <= 60).to.eql(true);
      expect(Cli.Fmt.Text.Width.measure(algorithm) <= 44).to.eql(true);
      expect(Cli.Fmt.Text.Width.measure(short) <= 37).to.eql(true);
      expect(Cli.Fmt.Text.Width.measure(none) <= 31).to.eql(true);
    });

    it('clips renderer-stamped log rows to available cells without wrapping', () => {
      const output = DevOutputLog.create({ maxLines: 5 });
      output.push(
        processEvent(
          'stderr',
          'Warning the configuration file "file:///sample/project/deno.json" is long\n',
        ),
      );
      output.push(
        processEvent(
          'stdout',
          '2:08:13 pm [vite] (client) page reload ui.react/ui/Prose.Markdown/-spec/common-界.ts\n',
        ),
      );

      const width = 50;
      const raw = DevScreen.toString({
        identity: pkg(),
        paths: paths(),
        url: 'http://localhost:1234/',
        lines: output.lines(),
        logLines: 2,
        ...frame(width),
      });
      const text = stripAnsi(raw);
      const allRows = text.split('\n');
      const logRow = /^\s+\d+ {2}(?:err|out) {2}/;
      const rows = allRows.filter((line) => logRow.test(line));
      const rawRows = raw.split('\n').filter((line) => logRow.test(stripAnsi(line)));

      expect(rows.length).to.eql(2);
      rows.forEach((line) => {
        expect(line.startsWith(' ')).to.eql(true);
        expect(Cli.Fmt.Text.Width.measure(line)).to.eql(width - 1);
      });
      expect(allRows[1]).to.eql('━'.repeat(width));
      expect(allRows).to.include('┄'.repeat(width));
      expect(rows[0]).to.include('…');
      expect(rows[0]).to.include('deno.json');
      expect(rows[1]).to.include('common-界.ts');
      const firstPayload = (rows[0] ?? '').replace(logRow, '');
      expect(firstPayload).to.not.eql('');
      expect(rawRows[0]).to.include(c.white(firstPayload));
    });

    it('keeps the child lane bounded below the log-prefix width', () => {
      const output = DevOutputLog.create({ maxLines: 1 });
      output.push(processEvent('stdout', 'a long retained log value\n'));
      const render = (width: number) =>
        stripAnsi(DevScreen.toString({
          identity: pkg(),
          paths: paths(),
          url: 'http://localhost:1234/',
          lines: output.lines(),
          logLines: 1,
          ...frame(width, 40),
        }));

      for (const width of [0, 1]) expectRowsBounded(render(width), width);
      for (const width of [2, 8]) {
        const logRow = render(width).split('\n').at(-1) ?? '';
        expect(Cli.Fmt.Text.Width.measure(logRow)).to.eql(width - 1);
      }
    });

    it('bottom-docks complete keyboard controls and omits them under width or height pressure', () => {
      const render = (width: number, height: number) =>
        DevScreen.toString({
          identity: pkg(),
          paths: paths(),
          url: 'http://localhost:1234/',
          lines: [],
          ...frame(width, height),
        });
      const wide = render(120, 40);
      const wideLines = stripAnsi(wide).split('\n');
      const narrow = stripAnsi(render(40, 40));
      const short = stripAnsi(render(120, 10));
      const output = DevOutputLog.create({ maxLines: 1 });
      output.push(processEvent('stdout', 'retained-under-pressure\n'));
      const pressured = stripAnsi(DevScreen.toString({
        identity: pkg(),
        paths: paths(),
        url: 'http://localhost:1234/',
        lines: output.lines(),
        logLines: 1,
        ...frame(120, 11),
      }));

      expectRowsBounded(wide, 120);
      expect(wide.split('\n').at(-2)).to.eql(
        c.dim(c.gray(Cli.Fmt.hr({ width: 120, weight: 'dashed' }))),
      );
      expect(wideLines.at(-2)).to.eql('┄'.repeat(120));
      expect(wide).to.include(c.dim(c.gray('open:')));
      expect(wide).to.include(c.bold(c.white('ctrl + c')));
      expect(wideLines.at(-1)).to.include('open: o (in browser)');
      expect(wideLines.at(-1)).to.include('quit: ctrl + c or q');
      expect(narrow).to.not.include('open:');
      expect(narrow).to.not.include('quit:');
      expect(short).to.not.include('open:');
      expect(short).to.not.include('quit:');
      expect(pressured).to.include('retained-under-pressure');
      expect(pressured).to.not.include('open:');
      expect(pressured).to.not.include('quit:');
      expect(render(120, 40)).to.eql(wide);
    });
  });

  describe('startup frame', () => {
    it('shares the balanced log lane with ready output', () => {
      const output = DevOutputLog.create({ maxLines: 2 });
      output.push(
        processEvent(
          'stdout',
          '2:08:13 pm [vite] page reload /sample/project/retained-tail.ts\n',
        ),
      );
      output.push(processEvent('stdout', 'short\n'));
      const width = 40;
      const args = {
        identity: pkg(),
        paths: paths(),
        url: 'http://localhost:1234/',
        lines: output.lines(),
        logLines: 2,
        ...frame(width, 40),
      };
      const startupRows = stripAnsi(DevScreen.startupToString({ ...args, spinner: '⠋' })).split(
        '\n',
      );
      const readyRows = stripAnsi(DevScreen.toString(args)).split('\n');
      const findLog = (rows: string[], sequence: number) => {
        return rows.find((line) => line.startsWith(` ${sequence}  out  `)) ?? '';
      };
      const startupLog = findLog(startupRows, 1);
      const readyLog = findLog(readyRows, 1);

      for (const line of [startupLog, readyLog]) {
        expect(line.startsWith(' 1  out  ')).to.eql(true);
        expect(Cli.Fmt.Text.Width.measure(line)).to.eql(width - 1);
        expect(line).to.include('…');
        expect(line).to.include('tail.ts');
      }
      expect(findLog(startupRows, 2)).to.eql(' 2  out  short');
      expect(findLog(readyRows, 2)).to.eql(' 2  out  short');
      expect(readyRows[1]).to.eql('━'.repeat(width));
      expect(readyRows).to.include('┄'.repeat(width));
    });

    it('budgets header, spinner, cursor, metadata, and elastic logs as one physical frame', () => {
      const output = DevOutputLog.create({ maxLines: 5 });
      output.push(processEvent('stdout', 'one\n'));
      output.push(processEvent('stdout', 'two\n'));
      output.push(processEvent('stdout', 'three\n'));
      const render = (height: number) =>
        stripAnsi(DevScreen.startupToString({
          identity: pkg(),
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
        identity: pkg(),
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
      expect(text).to.include('· 3d');
      expect(text).to.include(`\n 1  out  ${STARTING_DEV_SERVER}`);
      expect(text).to.include('\n 2  out  transforming modules…');
      expect(text).to.include('\n 3  err  warning: dependency pre-bundle pending…');
    });

    it('aligns the seeded startup row as output sequences widen', () => {
      const output = DevOutputLog.create({ maxLines: 120 });
      output.pushDisplay('stdout', STARTING_DEV_SERVER);
      for (let current = 1; current <= 100; current++) {
        output.push(processEvent('stdout', `line-${current}\n`));
      }

      const text = stripAnsi(DevScreen.startupToString({
        identity: pkg(),
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
  return { viewport: { width, height }, cursorRows: 1, renderedAt: RENDERED_AT };
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
  return {
    build: { time: RENDERED_AT - 3 * Time.Date.DAY },
    hash: { digest: HASH, parts: {} },
  } as t.DistPkg;
}
