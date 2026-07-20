import { c, describe, expect, it, stripAnsi, type t } from '../../-test.ts';
import { DevOutputLog } from '../u/u.dev.output.ts';
import { DevScreen } from '../u/u.dev.screen.ts';

const HASH = `sha256-${'88f8e3e041df504c3177b35ad742f4aebf99951a0c832fb64c1e1b2edef'}ccd11`;

function expectRowsBounded(text: string, width: number) {
  stripAnsi(text).split('\n').forEach((line) => expect(line.length <= width).to.eql(true));
}

describe('DevScreen', () => {
  it('renders a compact stable frame with bounded dev log rows', () => {
    const output = DevOutputLog.create({ maxLines: 5 });
    output.push(event('stdout', 'one\n'));
    output.push(event('stdout', 'two\n'));
    output.push(event('stderr', 'warn\n'));

    const raw = DevScreen.toString({
      pkg: pkg(),
      paths: paths(),
      url: 'http://localhost:1234/',
      lines: output.lines(),
      logLines: 2,
      width: 24,
    });
    const text = stripAnsi(raw);

    const rows = text.split('\n');
    const header = rows[0];
    const urlLine = rows.find((line) => line.includes('http://')) ?? '';
    expectRowsBounded(raw, 24);
    expect(header).to.eql('Dev   @sys/example 0.0.0');
    expect(text).to.include('━'.repeat(24) + '\n\n');
    expect(urlLine).to.include('…');
    expect(urlLine).to.include(':1234/');
    expect(text).to.include('\n         ↑\n         input');
    expect(text).to.not.include('module');
    expect(text).to.not.include('@sys/example@0.0.0');
    expect(raw).to.include(`${c.white(c.bold('@sys/example'))} ${c.gray('0.0.0')}`);
    expect(raw).to.not.include(c.bold(c.cyan('0.0.0')));
    expect(text).to.include('\n\n' + '┄'.repeat(24) + '\n');
    expect(text).to.not.include('dev log:');
    expect(text).to.not.include(' 1  out  one');
    expect(text).to.include(' 2  out  two');
    expect(text).to.include(' 3  err  warn');
    expect(text).to.not.include('options:');
  });

  it('compacts the header identity before allowing title/package collision', () => {
    const header = (width: number) =>
      stripAnsi(DevScreen.toString({
        pkg: { name: '@sys/ui-components', version: '0.0.319' },
        paths: paths(),
        url: 'http://localhost:1234/',
        lines: [],
        width,
      })).split('\n')[0];

    expect(header(40)).to.eql('Dev           @sys/ui-components 0.0.319');
    expect(header(29)).to.eql('Dev        @sys/ui-components');
    expect(header(20)).to.eql('  @sys/ui-components');
    expect(header(17)).to.eql('    ui-components');

    const tight = header(8);
    expect(tight.length).to.eql(8);
    expect(tight).to.not.include('@sys');
    expect(tight).to.include('…');
  });

  it('aligns metadata content with the log message column as sequence numbers widen', () => {
    const output = DevOutputLog.create({ maxLines: 120 });
    for (let i = 1; i <= 100; i++) output.push(event('stdout', `line-${i}\n`));

    const text = stripAnsi(DevScreen.toString({
      pkg: pkg(),
      paths: paths(),
      url: 'http://localhost:1234/',
      lines: output.lines(),
      logLines: 2,
      width: 80,
    }));
    const lines = text.split('\n');
    const header = lines[0];
    const urlLine = lines.find((line) => line.includes('http://localhost')) ?? '';
    const inputLine = lines.find((line) => line.includes('input')) ?? '';
    const logLine = lines.find((line) => line.includes('line-100')) ?? '';
    const column = logLine.indexOf('line-100');

    expect(column).to.eql(11);
    expect(header.indexOf('@sys/example 0.0.0')).to.eql(80 - '@sys/example 0.0.0'.length);
    expect(urlLine.indexOf('http://localhost')).to.eql(column);
    expect(urlLine.trimStart()).to.eql('http://localhost:1234/');
    expect(inputLine.indexOf('input')).to.eql(column);
    expect(logLine).to.include(' 100  out  line-100');
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

  it('keeps every frame row bounded even below metadata label width', () => {
    const output = DevOutputLog.create({ maxLines: 5 });
    output.push(event('stdout', 'VITE ready in 1234 ms\n'));

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

  it('collapses the output digest before allowing the row to overflow', () => {
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
    expect(full.length <= 60).to.eql(true);
    expect(algorithm.length <= 44).to.eql(true);
    expect(short.length <= 34).to.eql(true);
    expect(none.length <= 31).to.eql(true);
  });

  it('clips log rows to the measured available width without wrapping', () => {
    const output = DevOutputLog.create({ maxLines: 5 });
    output.push(
      event(
        'stderr',
        'Warning the configuration file "file:///Users/phil/code/org.sys/sys/deno.json" is long\n',
      ),
    );
    output.push(
      event(
        'stdout',
        '2:08:13 pm [vite] (client) page reload ui.react/Prose.Markdown/-spec/common.ts\n',
      ),
    );

    const raw = DevScreen.toString({
      pkg: pkg(),
      paths: paths(),
      url: 'http://localhost:1234/',
      lines: output.lines(),
      logLines: 2,
      width: 50,
    });
    const text = stripAnsi(raw);

    const rows = text.split('\n').filter((line) => /^\s+\d+  (err|out)  /.test(line));
    expect(rows.length).to.eql(2);
    rows.forEach((line) => expect(line.length <= 50).to.eql(true));
    expect(rows[0]).to.include('…');
    expect(rows[0]).to.include('deno.json');
    expect(raw).to.include(c.gray('…'));
  });

  it('bounds the full frame to the supplied terminal height', () => {
    const output = DevOutputLog.create({ maxLines: 5 });
    output.push(event('stdout', 'one\n'));
    output.push(event('stdout', 'two\n'));
    output.push(event('stderr', 'warn\n'));

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

  it('aligns option keys with the shared content column', () => {
    const output = DevOutputLog.create({ maxLines: 120 });
    for (let i = 1; i <= 100; i++) output.push(event('stdout', `line-${i}\n`));

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
    const logLine = lines.find((line) => line.includes('line-100')) ?? '';
    const quitLine = lines.find((line) => line.includes('ctrl + c')) ?? '';
    const moreLine = lines.find((line) => line.includes('shift + i')) ?? '';
    const column = logLine.indexOf('line-100');

    expect(column).to.eql(11);
    expect(quitLine.indexOf('ctrl + c')).to.eql(column);
    expect(moreLine.indexOf('shift + i')).to.eql(column);
  });

  it('renders options only when requested', () => {
    const width = 30;
    const text = stripAnsi(DevScreen.toString({
      pkg: pkg(),
      paths: paths(),
      url: 'http://localhost:1234/',
      lines: [],
      showOptions: true,
      width,
      height: 40,
    }));

    const lines = text.split('\n');
    const closeLine = lines.find((line) => line.startsWith('close')) ?? '';
    const moreLine = lines.find((line) => line.startsWith('more')) ?? '';
    const quitLine = lines.find((line) => line.startsWith('quit')) ?? '';

    expectRowsBounded(text, width);
    expect(text).to.include('options:\n' + '┄'.repeat(width));
    expect(closeLine.indexOf('i')).to.eql(9);
    expect(moreLine.indexOf('shift + i')).to.eql(9);
    expect(quitLine.indexOf('ctrl + c')).to.eql(9);
  });

  it('caps configured log lines to keep retained output bounded', () => {
    expect(DevScreen.logLines(undefined)).to.eql(10);
    expect(DevScreen.logLines('3')).to.eql(3);
    expect(DevScreen.logLines(-1)).to.eql(0);
    expect(DevScreen.logLines(10_000)).to.eql(200);
  });

  it('resolves reporter mode with raw fallback for silent and pkg-less runs', () => {
    expect(DevScreen.resolveReporter('raw', { isInteractive: () => true })).to.eql('raw');
    expect(DevScreen.resolveReporter('screen', { hasPkg: true, isInteractive: () => false })).to
      .eql('screen');
    expect(DevScreen.resolveReporter('screen', { isInteractive: () => true })).to.eql('raw');
    expect(DevScreen.resolveReporter('auto', { hasPkg: true, isInteractive: () => true })).to.eql(
      'screen',
    );
    expect(DevScreen.resolveReporter('auto', { hasPkg: true, isInteractive: () => false })).to.eql(
      'raw',
    );
    expect(
      DevScreen.resolveReporter('auto', { silent: true, hasPkg: true, isInteractive: () => true }),
    ).to.eql('raw');
  });
});

function event(source: t.Process.StdStream, text: string): t.Process.Event {
  return {
    source,
    data: new TextEncoder().encode(text),
    toString: () => text,
  };
}

function paths(): t.ViteConfig.Paths {
  return {
    cwd: '/tmp/pkg',
    app: {
      entry: 'src/index.html',
      outDir: 'dist',
      base: './',
    },
  };
}

function pkg(): t.Pkg {
  return {
    name: '@sys/example',
    version: '0.0.0',
  };
}

function dist(): t.DistPkg {
  return { hash: { digest: HASH, parts: {} } } as t.DistPkg;
}
