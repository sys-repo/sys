import { Cli, describe, expect, it, pkg } from '../../../-test.ts';
import { HttpServer } from '../mod.ts';

describe('HttpServer.print', () => {
  it('prints non-path info rows and uses path info only for URL decoration', () => {
    const lines: string[] = [];
    const original = console.info;
    console.info = (...args: unknown[]) => lines.push(args.map(String).join(' '));
    try {
      HttpServer.print({
        addr: { hostname: '127.0.0.1', port: 8080, transport: 'tcp' },
        pkg,
        hash: 'sha256-0391f000000000000000000000000000000000000000000000000000b313a8',
        info: { static: 'dist/', view: '/foo/bar/' },
      });
    } finally {
      console.info = original;
    }

    const output = Cli.stripAnsi(lines.join('\n'));
    expect(output).to.contain('module:');
    expect(output).to.contain('static:   dist/');
    expect(output).to.contain('dist:');
    expect(output).to.contain('url:      http://localhost:8080/foo/bar/');
    expect(output).not.to.contain('view:');
  });
});
