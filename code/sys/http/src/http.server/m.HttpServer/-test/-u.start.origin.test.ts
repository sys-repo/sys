import { Cli, describe, expect, it } from '../../../-test.ts';
import type { t } from '../common.ts';
import { HttpServer } from '../mod.ts';
import { type StartDependencies, startWith } from '../u/u.start.ts';
import { capturePrint } from './u.fixture.print.ts';

const NO_START: StartDependencies = {
  bindKeyboard() {
    throw new Error('Invalid options must not bind the keyboard.');
  },
  serve() {
    throw new Error('Invalid options must not open a listener.');
  },
};

describe('HttpServer.start origin', () => {
  it('wildcard bind address still reports a local origin', async () => {
    const app = HttpServer.create({ static: false });
    await using server = HttpServer.start(app, { silent: true, hostname: '0.0.0.0' });

    expect(server.hostname).to.eql('0.0.0.0');
    expect(server.origin).to.eql(`http://localhost:${server.port}`);
  });

  it('settles one exact ephemeral IPv4 authority across origin, status, and output', async () => {
    const app = HttpServer.create({ static: false });
    const options: t.HttpServer.Start.Options = {
      port: 0,
      hostname: '127.0.0.1',
      origin: 'exact-loopback',
      status: { urlPaths: ['/health'] },
    };
    const printed = capturePrint(() => HttpServer.start(app, options));
    await using server = printed.value;
    const output = Cli.stripAnsi(printed.output.join('\n'));

    expect(server.port).to.not.eql(0);
    expect(server.origin).to.eql(`http://127.0.0.1:${server.port}`);
    expect(server.status().urls).to.eql([{ href: `${server.origin}/health` }]);
    expect(output).to.contain(`${server.origin}/health`);
    expect(output).not.to.contain(`http://localhost:${server.port}`);
  });

  it('formats one exact IPv6 listener authority across origin and output', async () => {
    const app = HttpServer.create({ static: false });
    const options: t.HttpServer.Start.Options = { hostname: '::1', origin: 'exact-loopback' };
    const printed = capturePrint(() => HttpServer.start(app, options));
    await using server = printed.value;
    const output = Cli.stripAnsi(printed.output.join('\n'));

    expect(server.origin).to.eql(`http://[::1]:${server.port}`);
    expect(server.status().urls).to.eql([{ href: `${server.origin}/` }]);
    expect(output).to.contain(`${server.origin}/`);
  });

  it('rejects unknown origin modes before opening a listener', () => {
    const app = HttpServer.create({ static: false });
    const options: t.HttpServer.Start.Options = {
      silent: true,
      hostname: '127.0.0.1',
      origin: 'caller-origin' as t.HttpServer.Start.OriginMode,
    };
    const start = () => startWith(NO_START, app, options);
    expect(start).to.throw('HttpServer.start origin must be exact-loopback when specified');
  });

  it('rejects exact loopback origins for wildcard, hostname, and non-loopback binds', () => {
    const app = HttpServer.create({ static: false });
    const hostnames = [
      '0.0.0.0',
      '::',
      'localhost',
      '127.0.0.2',
      '[::1]',
      '192.0.2.10',
      '2001:db8::1',
    ];
    for (const hostname of hostnames) {
      const options: t.HttpServer.Start.Options = {
        silent: true,
        hostname,
        origin: 'exact-loopback',
      };
      const start = () => startWith(NO_START, app, options);
      expect(start, hostname).to.throw(
        'HttpServer.start exact-loopback origin requires a numeric loopback hostname',
      );
    }
  });

  it('snapshots exact origin authority against post-call option mutation', async () => {
    const app = HttpServer.create({ static: false });
    const input: t.HttpServer.Start.Options = {
      silent: true,
      hostname: '127.0.0.1',
      origin: 'exact-loopback',
      status: { urlPaths: ['/health'] },
    };
    await using server = HttpServer.start(app, input);
    input.hostname = '0.0.0.0';
    input.origin = undefined;
    input.status = { urlPaths: ['/changed'] };

    expect(server.hostname).to.eql('127.0.0.1');
    expect(server.origin).to.eql(`http://127.0.0.1:${server.port}`);
    expect(server.status().urls).to.eql([{ href: `${server.origin}/health` }]);
  });
});
