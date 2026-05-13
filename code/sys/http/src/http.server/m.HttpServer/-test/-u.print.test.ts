import { c, Cli, describe, expect, it, pkg } from '../../../-test.ts';
import { HttpServer } from '../mod.ts';

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
    expect(lines[1]).to.contain(c.dim(c.gray(Cli.Fmt.hr())));
    expect(Cli.stripAnsi(lines[1] ?? '')).to.match(/^━+$/);
    expect(lines[2]).to.contain('two');
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

  it('prints non-path info rows and uses path info only for URL decoration', () => {
    const lines = capturePrint(() => {
      HttpServer.print({
        addr: { hostname: '127.0.0.1', port: 8080, transport: 'tcp' },
        pkg,
        hash: 'sha256-0391f000000000000000000000000000000000000000000000000000b313a8',
        info: { static: 'dist/', view: '/foo/bar/' },
      });
    });

    const output = Cli.stripAnsi(lines.join('\n'));
    expect(output).to.contain('module');
    expect(output).to.contain('static   dist/');
    expect(output).to.contain('dist');
    expect(output).to.contain('url      http://localhost:8080/foo/bar/');
    expect(output).not.to.contain('view:');
  });

  it('keeps the first URL origin cyan and mutes repeated origins', () => {
    const raw = capturePrint(() => {
      HttpServer.print({
        addr: { hostname: '127.0.0.1', port: 8080, transport: 'tcp' },
        info: { root: '/', payments: '/payments/', view: '/view/' },
      });
    }).join('\n');

    const firstOrigin = c.cyan(`http://localhost:${c.bold(c.brightCyan('8080'))}`);
    const repeatedOrigin = c.dim(c.gray('http://localhost:8080'));
    expect(raw).to.contain(firstOrigin);
    expect(raw).to.contain(repeatedOrigin);
    expect(raw.indexOf(firstOrigin)).to.be.lessThan(raw.indexOf(repeatedOrigin));

    const output = Cli.stripAnsi(raw);
    expect(output).to.contain('url');
    expect(output).to.contain('http://localhost:8080/');
    expect(output).to.contain('http://localhost:8080/payments/');
    expect(output).to.contain('http://localhost:8080/view/');
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
