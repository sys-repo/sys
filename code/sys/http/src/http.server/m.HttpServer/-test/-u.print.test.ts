import { c, Cli, describe, expect, it, pkg, type t } from '../../../-test.ts';
import { HttpServer } from '../mod.ts';
import { printWith } from '../u/u.print.ts';

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
    const root =
      Cli.stripAnsi(output).split('\n').find((line) => line.trimStart().startsWith('root')) ?? '';

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
