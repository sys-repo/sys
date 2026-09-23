import { HashFmt } from '@sys/crypto/fmt';
import { c, Cli, describe, expect, it, pkg, Str, type t } from '../../../-test.ts';
import { HttpServer } from '../mod.ts';
import { printWith } from '../u.print/u.print.ts';

type PrintDependencies = Parameters<typeof printWith>[0];
type DetailCall = Parameters<t.HttpServer.Print.FormatDetail>[0] & { readonly receiver: unknown };

const ADDR: Deno.NetAddr = { hostname: '127.0.0.1', port: 8080, transport: 'tcp' };
const NON_TTY: PrintDependencies = {
  isTerminal: () => false,
  screenSize() {
    throw new Error('Redirected output must not measure the terminal.');
  },
};

describe('HttpServer.print', () => {
  it('adds outer newlines and separates blocks only within the same output sink', () => {
    const printPair = () => {
      printWith(NON_TTY, { addr: ADDR, name: 'one' });
      printWith(NON_TTY, { addr: ADDR, name: 'two' });
    };
    const lines = capturePrint(printPair);
    const [first, rule, second] = lines;

    expect(lines.length).to.eql(3);
    expect(first).to.contain('one');
    expect(second).to.contain('two');
    // Edge newlines are part of the printed output contract.
    for (const block of [first, second]) {
      expect(block.startsWith('\n')).to.eql(true);
      expect(block.endsWith('\n')).to.eql(true);
    }
    expect(rule).to.eql(c.dim(c.gray(Cli.Fmt.hr())));
    expect(capturePrint(printPair)).to.eql(lines);
  });

  it('passes HTTP context to the shared service formatter without changing status details', () => {
    const status: t.HttpServer.Status.Options = {
      kind: 'static',
      root: `${Deno.cwd()}/dist`,
      details: [{ label: 'owner', value: 'fact' }],
      urlPaths: ['/', '/ui/'],
    };
    const options: t.HttpServer.Print.Options = {
      addr: ADDR,
      name: 'selected',
      pkg,
      hash: 'sha256-short',
      requestedPort: 8090,
      dir: '/ignored',
      info: { ignored: 'legacy' },
      status,
      keyboard: { open: 'O', quit: 'Ctrl+C or Q' },
    };
    const service: t.Cli.Fmt.Service.Input = {
      name: 'selected',
      module: `${pkg.name} ${pkg.version}`,
      status: {
        state: 'ready',
        root: 'dist',
        details: [
          { label: 'owner', value: 'fact' },
          { label: 'dist', value: 'sha256-short ← dist/dist.json' },
          { label: 'port', value: '8090 already in use; using 8080' },
        ],
        urls: [{ href: 'http://localhost:8080/' }, { href: 'http://localhost:8080/ui/' }],
      },
      keyboard: { open: 'O', quit: 'Ctrl+C or Q' },
    };
    const output = capturePrint(() => printWith(NON_TTY, options));
    const expected = Cli.Fmt.Service.format(service, { terminal: false });

    expect(output).to.eql([`\n${expected}\n`]);
    expect(status.details).to.eql([{ label: 'owner', value: 'fact' }]);
  });

  it('uses explicit empty details instead of legacy info', () => {
    const output = render({ info: { legacy: 'not shown' }, status: { details: [] } });
    expect(output).not.to.contain('legacy');
    expect(output).not.to.contain('not shown');
  });

  it('preserves an empty name and defaults missing names to kind, then http', () => {
    const output = render({ name: '', status: { kind: 'static' } });
    expect(output.split('\n')[1].trimEnd()).to.eql('service');
    expect(output).not.to.contain('static');
    expect(render({ status: { kind: 'static' } })).to.contain('static');
    expect(render({})).to.contain('http');
  });

  it('prints legacy info as details without inferring URLs', () => {
    const output = render({ info: { view: '/foo/bar/' } });
    expect(output).to.contain('view     /foo/bar/');
    expect(output).to.contain('http://localhost:8080/');
    expect(output).not.to.contain('http://localhost:8080/foo/bar/');
  });

  it('formats supplied details unbound, but not identical generated rows', () => {
    const detail = { label: 'dist', value: 'short ← dist/dist.json' };
    const calls: DetailCall[] = [];
    const options: t.HttpServer.Print.Options = {
      addr: ADDR,
      pkg,
      hash: 'short',
      requestedPort: 8090,
      status: { details: [detail] },
      formatDetail(this: unknown, args) {
        calls.push({ receiver: this, ...args });
        return 'custom detail';
      },
    };
    const output = render(options);

    expect(calls).to.eql([{ receiver: undefined, detail, maxWidth: undefined }]);
    expect(calls[0].detail).to.equal(detail);
    expect(output).to.contain('custom detail');
    expect(output).to.contain('short ← dist/dist.json');
    expect(output).to.contain('8090 already in use; using 8080');
  });

  it('also formats details supplied through legacy info', () => {
    const output = render({ info: { mode: 'dev' }, formatDetail: () => 'custom info' });
    expect(output).to.contain('mode     custom info');
  });

  it('preserves file links when they fit and falls back to the plain value when they do not', () => {
    const directory = new URL(`file:///fixture/${'long-directory/'.repeat(12)}dist/`);
    const manifest = new URL('dist.json', directory);
    const hash = `sha256-${'0'.repeat(59)}91492`;
    const linkedPath = Cli.Fmt.hyperlink(c.gray('dist/'), directory, { underline: true });
    const linkedDigest = HashFmt.digest(hash, { arrow: true, url: manifest });
    const detail = { label: 'build', value: 'fallback' };
    const options: t.HttpServer.Print.Options = {
      addr: ADDR,
      name: '@sample/r2',
      status: { details: [detail], urlPaths: ['/', '/ui/'] },
      formatDetail: () => `${linkedPath} ${linkedDigest}`,
    };
    const wide = terminal(80);
    const narrow = terminal(24);
    const output = capturePrint(() => printWith(wide, options)).join('\n');
    const clipped = capturePrint(() => printWith(narrow, options)).join('\n');

    expect(output).to.contain(linkedPath);
    expect(output).to.contain(linkedDigest);
    expect(Cli.stripAnsi(output).trim()).to.eql(Str.dedent(`
      service   @sample/r2
       build    dist/ ← digest:sha256:#91492
       url      http://localhost:8080/
                http://localhost:8080/ui/
    `));
    // OSC 8 bytes matter here: neither file link may survive the plain-value fallback.
    expect(clipped).not.to.contain('\x1b]8;;');
    expect(Cli.stripAnsi(clipped)).to.contain('build    fallback');
    expect(detail).to.eql({ label: 'build', value: 'fallback' });
    for (const row of output.split('\n')) {
      expect(Cli.Fmt.Text.Width.measure(row)).to.be.at.most(80);
    }
    for (const row of clipped.split('\n')) {
      expect(Cli.Fmt.Text.Width.measure(row)).to.be.at.most(24);
    }
  });

  it('prefers status.root to dir and shortens roots beneath cwd', () => {
    const fallback = render({ dir: `${Deno.cwd()}/dist` });
    const explicit = render({ dir: '/ignored', status: { root: './served' } });
    const empty = render({ dir: '/ignored', status: { root: '' } });

    expect(fallback).to.contain('root     dist');
    expect(fallback).not.to.contain(Deno.cwd());
    expect(explicit).to.contain('root     served');
    expect(explicit).not.to.contain('/ignored');
    expect(empty).not.to.contain('root');
  });

  it('prints a shortened hash only when both hash and package are supplied', () => {
    const hash = `sha256-${'0123456789abcdef'.repeat(4)}`;
    const expected = 'sha256-01234…abcdef ← dist/dist.json';

    expect(render({ hash })).not.to.contain('dist.json');
    expect(render({ pkg })).not.to.contain('dist.json');
    expect(render({ pkg, hash })).to.contain(expected);
  });

  it('explains a port fallback only when a different nonzero port was requested', () => {
    for (const requestedPort of [undefined, 0, 8080]) {
      expect(render({ requestedPort })).not.to.contain('already in use');
    }
    expect(render({ requestedPort: 8090 })).to.contain('8090 already in use; using 8080');
  });

  it('uses browser-safe origins when no settled origin is supplied', () => {
    const wildcard = render({ addr: { ...ADDR, hostname: '0.0.0.0' } });
    const network = render({ addr: { ...ADDR, hostname: '192.0.2.10' } });
    expect(wildcard).to.contain('http://localhost:8080/');
    expect(network).to.contain('http://192.0.2.10:8080/');
  });

  it('preserves exact settled IPv4 and IPv6 origins', () => {
    const options: t.HttpServer.Print.Options = {
      addr: ADDR,
      status: { urlPaths: ['/health'] },
    };
    for (const origin of ['http://127.0.0.1:8080', 'http://[::1]:8080']) {
      const output = render(options, NON_TTY, origin);
      expect(output).to.contain(`${origin}/health`);
      expect(output).not.to.contain('localhost');
    }
  });

  it('measures once per print and fits both blocks and separators to that width', () => {
    const options: t.HttpServer.Print.Options = {
      addr: ADDR,
      name: 'long-name-'.repeat(20),
      status: { details: [{ label: 'detail', value: '東京'.repeat(30) }] },
    };
    let probes = 0;
    let measures = 0;
    const deps: PrintDependencies = {
      isTerminal() {
        probes += 1;
        return true;
      },
      screenSize() {
        measures += 1;
        return { width: 24, height: 24 };
      },
    };
    const lines = capturePrint(() => {
      printWith(deps, options);
      printWith(deps, options);
    });

    expect({ probes, measures }).to.eql({ probes: 2, measures: 2 });
    expect(lines.length).to.eql(3);
    expect(Cli.stripAnsi(lines[1])).to.eql('━'.repeat(24));
    for (const row of lines.join('\n').split('\n')) {
      expect(Cli.Fmt.Text.Width.measure(row)).to.be.at.most(24);
    }
    expect(render(options)).to.contain('東京'.repeat(30));
  });

  it('prints service output through the public entry point', () => {
    const options = { addr: ADDR, name: 'public' };
    const output = capturePrint(() => HttpServer.print(options)).join('\n');
    expect(Cli.stripAnsi(output)).to.contain('service   public');
  });
});

/**
 * Helpers:
 */
function terminal(width: number): PrintDependencies {
  return { isTerminal: () => true, screenSize: () => ({ width, height: 24 }) };
}

function render(
  options: Partial<t.HttpServer.Print.Options>,
  deps = NON_TTY,
  origin?: t.StringUrl,
): string {
  const output = capturePrint(() => printWith(deps, { addr: ADDR, ...options }, origin));
  return Cli.stripAnsi(output.join('\n'));
}

function capturePrint(fn: () => void): readonly string[] {
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
