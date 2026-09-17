import { HashFmt } from '@sys/crypto/fmt';
import { c, Cli, describe, expect, it, pkg, Str, type t } from '../../../-test.ts';
import { HttpServer } from '../mod.ts';
import { printWith } from '../u.print/u.print.ts';

const SAMPLE_ROOT =
  '/test/fixtures/fake-workspace/.pi/@sys/dist/@sys.driver-pi/sha256-0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef' as t.StringDir;

describe('HttpServer.print', () => {
  it('prints no first rule and uses a subtle separator between blocks', () => {
    const lines = capturePrint(() => {
      HttpServer.print({
        addr: { hostname: '127.0.0.1', port: 8080, transport: 'tcp' },
        name: 'one',
      });
      HttpServer.print({
        addr: { hostname: '127.0.0.1', port: 9090, transport: 'tcp' },
        name: 'two',
      });
    });

    expect(lines.length).to.eql(3);
    expect(lines[0]).to.contain('one');
    expect(lines[0]?.startsWith('\n')).to.eql(true);
    expect(lines[0]?.endsWith('\n')).to.eql(true);
    expect(lines[1]).to.contain(c.dim(c.gray(Cli.Fmt.hr())));
    expect(Cli.stripAnsi(lines[1] ?? '')).to.match(/^━+$/);
    expect(lines[2]).to.contain('two');
    expect(lines[2]?.startsWith('\n')).to.eql(true);
    expect(lines[2]?.endsWith('\n')).to.eql(true);
  });

  it('prints service before module provenance', () => {
    const lines = capturePrint(() => {
      HttpServer.print({
        addr: { hostname: '127.0.0.1', port: 8080, transport: 'tcp' },
        name: 'svc',
        pkg,
      });
    });

    const output = Cli.stripAnsi(lines.join('\n'));
    expect(output.indexOf('service')).to.be.lessThan(output.indexOf('module'));
    expect(output).to.not.contain('service:');
    expect(output).to.not.contain('module:');
  });

  it('owner details → identity, build, then requestable URLs', () => {
    const output = capturePrint(() => {
      printWith(
        { isTerminal: () => false, screenSize: () => ({ width: 80, height: 24 }) },
        {
          addr: { hostname: '127.0.0.1', port: 8080, transport: 'tcp' },
          name: '@sample/r2',
          status: {
            details: [{ label: 'build', value: 'dist/ ← digest:sha256:#e1743' }],
            urlPaths: ['/', '/ui/'],
          },
        },
      );
    }).join('\n');

    const lines = Cli.stripAnsi(output).trim().split('\n');
    const text = lines.map((line) => line.trimEnd()).join('\n');
    expect(text).to.eql(Str.dedent(`
      service   @sample/r2
        build   dist/ ← digest:sha256:#e1743
        url     http://localhost:8080/
                http://localhost:8080/ui/
    `));
  });

  it('linked detail → compact rows without hyperlink-sized trailing padding', () => {
    const directory = new URL(`file:///fixture/${'long-directory/'.repeat(12)}dist/`);
    const manifest = new URL('dist.json', directory);
    const hash = `sha256-${'0'.repeat(59)}91492`;
    const linkedPath = Cli.Fmt.hyperlink(c.gray('dist/'), directory, { underline: true });
    const linkedDigest = HashFmt.digest(hash, { arrow: true, url: manifest });
    const detail = { label: 'build', value: 'dist/ ← digest:sha256:#91492' };

    const output = capturePrint(() => {
      printWith(
        { isTerminal: () => true, screenSize: () => ({ width: 80, height: 24 }) },
        {
          addr: { hostname: '127.0.0.1', port: 8080, transport: 'tcp' },
          name: '@sample/r2',
          status: { details: [detail], urlPaths: ['/', '/ui/', '/api/hello', '/ui/dist.json'] },
          formatDetail: () => `${linkedPath} ${linkedDigest}`,
        },
      );
    }).join('\n');

    expect(output).to.contain(linkedPath);
    expect(output).to.contain(linkedDigest);
    for (const line of output.split('\n')) {
      expect(Cli.Fmt.Text.Width.measure(line)).to.be.at.most(80);
    }
    expect(Cli.stripAnsi(output).trim()).to.eql(Str.dedent(`
      service   @sample/r2
        build   dist/ ← digest:sha256:#91492
        url     http://localhost:8080/
                http://localhost:8080/ui/
                http://localhost:8080/api/hello
                http://localhost:8080/ui/dist.json
    `));
    expect(detail).to.eql({ label: 'build', value: 'dist/ ← digest:sha256:#91492' });
  });

  it('undefined or over-width detail presentation → the plain fact', () => {
    const detail = { label: 'build', value: 'plain' };
    for (const formatted of [undefined, 'x'.repeat(71), `short\n${'x'.repeat(71)}`]) {
      const output = capturePrint(() => {
        printWith(
          { isTerminal: () => true, screenSize: () => ({ width: 80, height: 24 }) },
          {
            addr: { hostname: '127.0.0.1', port: 8080, transport: 'tcp' },
            name: 'example',
            status: { details: [detail] },
            formatDetail: (args) => {
              expect(args.detail).to.eql(detail);
              expect(args.maxWidth).to.eql(70);
              return formatted;
            },
          },
        );
      }).join('\n');
      expect(Cli.stripAnsi(output).trim()).to.eql(Str.dedent(`
        service   example
          build   plain
          url     http://localhost:8080/
      `));
    }
  });

  it('multiline label → budget comes from the widest physical line', () => {
    const formatted = c.cyan('x'.repeat(65));
    for (const terminal of [true, false]) {
      let maxWidth: number | undefined;
      const output = capturePrint(() => {
        printWith(
          { isTerminal: () => terminal, screenSize: () => ({ width: 80, height: 24 }) },
          {
            addr: { hostname: '127.0.0.1', port: 8080, transport: 'tcp' },
            name: 'example',
            status: { details: [{ label: 'local\nremote', value: 'plain' }] },
            formatDetail: (args) => {
              maxWidth = args.maxWidth;
              return formatted;
            },
          },
        );
      }).join('\n');

      expect(maxWidth).to.eql(terminal ? 70 : undefined);
      expect(output).to.contain(formatted);
      expect(Cli.stripAnsi(output).trim()).to.eql(Str.dedent(`
        service   example
          local   ${'x'.repeat(65)}
        remote${' '.repeat(4)}
          url     http://localhost:8080/
      `));
      for (const line of output.split('\n')) {
        expect(Cli.Fmt.Text.Width.measure(line)).to.be.at.most(80);
      }
    }
  });

  it('narrow terminal → each label line is fitted and styled independently', () => {
    const cases = [
      { width: 24, first: c.gray('  local'), last: c.gray('remote'), lastGap: 4 },
      {
        width: 12,
        first: `${c.gray('  ')}${Cli.Fmt.omission()}${c.gray('l')}`,
        last: `${c.gray('re')}${Cli.Fmt.omission()}${c.gray('e')}`,
        lastGap: 3,
      },
    ];
    for (const { width, first, last, lastGap } of cases) {
      const output = capturePrint(() => {
        printWith(
          { isTerminal: () => true, screenSize: () => ({ width, height: 24 }) },
          {
            addr: { hostname: '127.0.0.1', port: 8080, transport: 'tcp' },
            name: 'example',
            status: { details: [{ label: 'local\nremote', value: 'one\ntwo' }] },
          },
        );
      }).join('\n');

      // Each line's style closes before pair padding and the independently styled value.
      const rows = output.trim().split('\n').slice(1, 3);
      expect(rows[0]).to.eql(`${first}   ${c.gray('one')}`);
      expect(rows[1]).to.eql(`${last}${' '.repeat(lastGap)}${c.gray('two')}`);
      for (const line of output.split('\n')) {
        expect(Cli.Fmt.Text.Width.measure(line)).to.be.at.most(width);
      }
    }
  });

  it('multiline presentation → fits each display line, not their combined width', () => {
    const first = 'a'.repeat(40);
    const last = '東京'.repeat(10);
    const linked = Cli.Fmt.hyperlink(c.cyan(last), new URL('file:///fixture/manifest.json'));
    const detail = { label: 'notes', value: 'plain' };
    const output = capturePrint(() => {
      printWith(
        { isTerminal: () => true, screenSize: () => ({ width: 80, height: 24 }) },
        {
          addr: { hostname: '127.0.0.1', port: 8080, transport: 'tcp' },
          name: 'example',
          status: { details: [detail] },
          formatDetail: () => `${c.green(first)}\n\n${linked}`,
        },
      );
    }).join('\n');

    expect(output).to.contain(linked);
    expect(Cli.stripAnsi(output).trim()).to.eql(Str.dedent(`
      service   example
        notes   ${first}
      ${' '.repeat(10)}
      ${' '.repeat(10)}${last}
        url     http://localhost:8080/
    `));
    for (const line of output.split('\n')) {
      expect(Cli.Fmt.Text.Width.measure(line)).to.be.at.most(80);
    }
    expect(detail).to.eql({ label: 'notes', value: 'plain' });
  });

  it('plain multiline detail → each line fits independently, including formatter fallback', () => {
    const first = 'a'.repeat(40);
    const last = 'b'.repeat(40);
    for (const formatted of [undefined, 'x'.repeat(71)]) {
      const output = capturePrint(() => {
        printWith(
          { isTerminal: () => true, screenSize: () => ({ width: 80, height: 24 }) },
          {
            addr: { hostname: '127.0.0.1', port: 8080, transport: 'tcp' },
            name: 'example',
            status: { details: [{ label: 'notes', value: `${first}\n\n${last}` }] },
            formatDetail: () => formatted,
          },
        );
      }).join('\n');
      expect(Cli.stripAnsi(output).trim()).to.eql(Str.dedent(`
        service   example
          notes   ${first}
        ${' '.repeat(10)}
        ${' '.repeat(10)}${last}
          url     http://localhost:8080/
      `));
    }
  });

  it('non-TTY multiline detail → preserves blank continuation rows', () => {
    const output = capturePrint(() => {
      printWith(
        { isTerminal: () => false, screenSize: () => ({ width: 80, height: 24 }) },
        {
          addr: { hostname: '127.0.0.1', port: 8080, transport: 'tcp' },
          name: 'example',
          status: { details: [{ label: 'notes', value: 'first\n\nlast' }] },
        },
      );
    }).join('\n');
    expect(Cli.stripAnsi(output).trim()).to.eql(Str.dedent(`
      service   example
        notes   first
      ${' '.repeat(10)}
      ${' '.repeat(10)}last
        url     http://localhost:8080/
    `));
  });

  it('prints a stable service fallback when no display name is provided', () => {
    const lines = capturePrint(() => {
      HttpServer.print({
        addr: { hostname: '127.0.0.1', port: 8080, transport: 'tcp' },
        status: { kind: 'static' },
      });
    });

    const output = Cli.stripAnsi(lines.join('\n'));
    expect(output).to.contain('service');
    expect(output).to.contain('static');
  });

  it('keeps roots beneath the current directory relative in startup output', () => {
    const lines = capturePrint(() => {
      HttpServer.print({
        addr: { hostname: '127.0.0.1', port: 8080, transport: 'tcp' },
        status: { root: `${Deno.cwd()}/dist` as t.StringDir },
      });
    });

    const output = Cli.stripAnsi(lines.join('\n'));
    expect(output).to.contain('dist');
    expect(output).to.not.contain(Deno.cwd());
  });

  it('keeps service identity and module provenance readable without bold weight', () => {
    const raw = capturePrint(() => {
      HttpServer.print({
        addr: { hostname: '127.0.0.1', port: 8080, transport: 'tcp' },
        name: 'stripe:dev:fixture',
        pkg,
      });
    }).join('\n');

    expect(raw).to.contain(c.white('stripe:dev:fixture'));
    expect(raw).to.not.contain(c.bold(c.white('stripe:dev:fixture')));
    expect(raw).to.not.contain(c.bold(c.white(pkg.name)));
  });

  it('renders keyboard affordances inside the service-status block', () => {
    const lines = capturePrint(() => {
      HttpServer.print({
        addr: { hostname: '127.0.0.1', port: 8080, transport: 'tcp' },
        name: 'svc',
        keyboard: { open: 'O', quit: 'Ctrl+C or Q' },
      });
    });

    const output = Cli.stripAnsi(lines.join('\n'));
    expect(output).to.contain('service');
    expect(output).to.contain('  open');
    expect(output).to.contain('O');
    expect(output).to.contain('  quit');
    expect(output).to.contain('Ctrl+C or Q');
    expect(output).to.not.contain('keyboard:');
  });

  it('prints info as details and uses explicit owner URL paths for URLs', () => {
    const lines = capturePrint(() => {
      HttpServer.print({
        addr: { hostname: '127.0.0.1', port: 8080, transport: 'tcp' },
        pkg,
        hash: 'sha256-0391f000000000000000000000000000000000000000000000000000b313a8',
        info: { static: 'dist/', view: '/foo/bar/' },
        status: { urlPaths: ['/foo/bar/'] },
      });
    });

    const output = Cli.stripAnsi(lines.join('\n'));
    expect(output).to.contain('module');
    expect(output).to.contain('static   dist/');
    expect(output).to.contain('view     /foo/bar/');
    expect(output).to.contain('dist');
    expect(output).to.contain('url      http://localhost:8080/foo/bar/');
    expect(output).not.to.contain('view:');
  });

  it('does not infer URL rows from path-like info values', () => {
    const lines = capturePrint(() => {
      HttpServer.print({
        addr: { hostname: '127.0.0.1', port: 8080, transport: 'tcp' },
        info: { view: '/foo/bar/' },
      });
    });

    const output = Cli.stripAnsi(lines.join('\n'));
    expect(output).to.contain('view');
    expect(output).to.contain('/foo/bar/');
    expect(output).to.contain('url');
    expect(output).to.contain('http://localhost:8080/');
    expect(output).not.to.contain('http://localhost:8080/foo/bar/');
  });

  it('keeps the first URL origin cyan and renders later URLs gray', () => {
    const raw = capturePrint(() => {
      HttpServer.print({
        addr: { hostname: '127.0.0.1', port: 8080, transport: 'tcp' },
        status: { urlPaths: ['/', '/payments/', '/view/'] },
      });
    }).join('\n');

    const firstOrigin = `${c.cyan('http://localhost:')}${c.bold(c.cyan('8080'))}`;
    const repeatedOrigin = c.gray('http://localhost:8080');
    expect(raw).to.contain(firstOrigin);
    expect(raw).to.contain(repeatedOrigin);
    expect(raw).to.not.contain(c.dim(c.gray('http://localhost:8080')));
    expect(raw.indexOf(firstOrigin)).to.be.lessThan(raw.indexOf(repeatedOrigin));

    const output = Cli.stripAnsi(raw);
    expect(output).to.contain('url');
    expect(output).to.contain('http://localhost:8080/');
    expect(output).to.contain('http://localhost:8080/payments/');
    expect(output).to.contain('http://localhost:8080/view/');
  });

  it('prints a browser-safe local origin from the listener address', () => {
    const wildcard = capturePrint(() => {
      HttpServer.print({
        addr: { hostname: '0.0.0.0', port: 8080, transport: 'tcp' },
      });
    }).join('\n');
    const network = capturePrint(() => {
      HttpServer.print({
        addr: { hostname: '192.0.2.10', port: 9090, transport: 'tcp' },
      });
    }).join('\n');

    expect(Cli.stripAnsi(wildcard)).to.contain('http://localhost:8080/');
    expect(Cli.stripAnsi(network)).to.contain('http://192.0.2.10:9090/');
  });

  it('fits direct startup rows and dividers to terminal cells without changing non-TTY output', () => {
    const detail = '東京 café e\u0301 — retained startup detail for a narrow terminal';
    const input = {
      addr: { hostname: '127.0.0.1', port: 8080, transport: 'tcp' as const },
      name: '🧪 direct startup service with a long terminal identity',
      pkg,
      hash: 'sha256-0391f000000000000000000000000000000000000000000000000000b313a8',
      requestedPort: 8090,
      keyboard: { open: 'Open the application in a browser', quit: 'Ctrl+C or Q to stop service' },
      status: {
        kind: 'dist',
        root: SAMPLE_ROOT,
        urlPaths: ['/東京/café/e\u0301/long/startup/path/' as t.StringUrlRoute],
        details: [{ label: 'capabilities-東京-e\u0301-with-a-long-name', value: detail }],
      },
    };
    const render = (isTerminal: boolean, width: number) =>
      capturePrint(() => {
        printWith(
          {
            isTerminal: () => isTerminal,
            screenSize: () => ({ width, height: 24 }),
          },
          input,
        );
        printWith(
          {
            isTerminal: () => isTerminal,
            screenSize: () => ({ width, height: 24 }),
          },
          input,
        );
      }).join('\n');

    for (const width of [48, 24, 8]) {
      const terminal = render(true, width);
      const terminalRows = Cli.stripAnsi(terminal).split('\n').filter((row) => row !== '');
      expect(terminal).to.contain('\u001b[');
      expect(Cli.stripAnsi(terminal)).to.contain('…');
      for (const row of terminalRows) {
        expect(Cli.Fmt.Text.Width.measure(row)).to.be.at.most(width);
      }
    }

    const narrowNonTty = render(false, 24);
    expect(narrowNonTty).to.eql(render(false, 120));
    expect(Cli.stripAnsi(narrowNonTty)).to.contain(SAMPLE_ROOT);
    expect(Cli.stripAnsi(narrowNonTty)).to.contain(detail);
  });

  it('fits root paths against the widest table label', () => {
    const output = capturePrint(() => {
      printWith(
        {
          isTerminal: () => true,
          screenSize: () => ({ width: 48, height: 24 }),
        },
        {
          addr: { hostname: '127.0.0.1', port: 8080, transport: 'tcp' },
          status: {
            kind: 'dist',
            root: SAMPLE_ROOT,
            details: [{ label: 'capabilities', value: 'read, watch' }],
          },
        },
      );
    }).join('\n');
    const lines = Cli.stripAnsi(output).split('\n');
    const root = lines.find((line) => line.trimStart().startsWith('root')) ?? '';

    expect(root).to.contain('9abcdef');
    expect(Cli.Fmt.Text.Width.measure(root)).to.be.at.most(48);
  });
});

function capturePrint(fn: () => void): string[] {
  const lines: string[] = [];
  const original = console.info;
  console.info = (...args: unknown[]) => lines.push(args.map(String).join(' '));
  try {
    fn();
  } finally {
    console.info = original;
  }
  return lines;
}
