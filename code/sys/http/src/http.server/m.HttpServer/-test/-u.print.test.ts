import { Cli, describe, expect, it, pkg } from '../../../-test.ts';
import { HttpServer } from '../mod.ts';

describe('HttpServer.print', () => {
  it('prints one leading separator and no trailing separator per block', () => {
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

    expect(lines.length).to.eql(4);
    expect(lines[0]).to.eql('');
    expect(lines[1]).to.contain('one');
    expect(lines[2]).to.eql('');
    expect(lines[3]).to.contain('two');
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
    expect(output).to.contain('module:');
    expect(output).to.contain('static:   dist/');
    expect(output).to.contain('dist:');
    expect(output).to.contain('url:      http://localhost:8080/foo/bar/');
    expect(output).not.to.contain('view:');
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
