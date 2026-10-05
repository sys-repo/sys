import { Cli, describe, expect, it, Testing } from '../../../-test.ts';
import type { t } from '../common.ts';
import { HttpServer } from '../mod.ts';
import { capturePrint } from './u.fixture.print.ts';

describe('HttpServer.start presentation', () => {
  it('linked startup presentation → unchanged renderer-neutral status facts', async () => {
    const app = HttpServer.create({ static: false });
    const detail = { label: 'build', value: 'dist/' };
    const directory = new URL('file:///fixture/dist/');
    const linked = Cli.Fmt.hyperlink('dist/', directory, { underline: true });
    const options: t.HttpServer.Start.Options = {
      hostname: '127.0.0.1',
      port: 0,
      strictPort: true,
      keyboard: false,
      status: { details: [detail] },
      formatDetail: () => linked,
    };
    const printed = capturePrint(() => HttpServer.start(app, options));
    await using server = printed.value;
    const status = server.status();

    expect(printed.output.join('\n')).to.contain(linked);
    expect(status.details).to.eql([detail]);
    expect(status).not.to.have.property('formatDetail');
    expect(status).not.to.have.property('servicePresentation');
  });

  it('silent start → captures local presentation without invoking it or changing status facts', async () => {
    const app = HttpServer.create({ static: false });
    const detail = { label: 'shell', value: 'dist/' };
    let reads = 0;
    let calls = 0;
    const original: t.HttpServer.Print.FormatDetail = () => {
      calls += 1;
      return 'rich';
    };
    let selected = original;
    const options: t.HttpServer.Start.Options = {
      silent: true,
      port: 0,
      strictPort: true,
      status: { details: [detail] },
      get formatDetail() {
        reads += 1;
        return selected;
      },
    };
    const printed = capturePrint(() => HttpServer.start(app, options));
    await using server = printed.value;
    selected = () => 'replacement';
    detail.value = 'mutated';
    const status = server.status();
    const captured = server.servicePresentation?.formatDetail;
    const capturedDetail = status.details?.[0];

    expect(printed.output).to.eql([]);
    expect({ reads, calls }).to.eql({ reads: 1, calls: 0 });
    expect(captured).to.equal(original);
    expect(status.details).to.eql([{ label: 'shell', value: 'dist/' }]);
    expect(status).not.to.have.property('servicePresentation');
    expect(status).not.to.have.property('formatDetail');
    if (!captured || !capturedDetail) throw new Error('Expected captured formatter and detail.');
    expect(capturedDetail).not.to.equal(detail);
    expect(captured({ detail: capturedDetail })).to.eql('rich');
    expect(calls).to.eql(1);
  });

  it('omits presentation when no detail formatter is supplied', async () => {
    const app = HttpServer.create({ static: false });
    await using server = HttpServer.start(app, { silent: true, port: 0, strictPort: true });
    expect(server.servicePresentation).to.eql(undefined);
  });

  it('formatter failure after listen → original error and exact port released', async () => {
    const app = HttpServer.create({ static: false });
    const hostname = '127.0.0.1';
    const port = Testing.randomPort();
    const failure = new Error('HttpServer.start:test:format-failure');
    let formatCalls = 0;
    const options: t.HttpServer.Start.Options = {
      port,
      hostname,
      strictPort: true,
      keyboard: false,
      status: { details: [{ label: 'build', value: 'fixture' }] },
      formatDetail() {
        formatCalls += 1;
        // Prove that this failure occurs while the exact listener is already bound.
        expect(() => {
          using _unexpected = Deno.listen({ hostname, port });
        }).to.throw(Deno.errors.AddrInUse);
        throw failure;
      },
    };

    let caught: unknown;
    let unexpected: t.HttpServer.Started | undefined;
    try {
      unexpected = HttpServer.start(app, options);
    } catch (error) {
      caught = error;
    } finally {
      await unexpected?.close('test:unexpected-start');
    }
    expect(formatCalls).to.eql(1);
    expect(caught).to.equal(failure);

    await Testing.retry(10, { silent: true, delay: 10 }, async () => {
      await using replacement = HttpServer.start(app, {
        port,
        hostname,
        strictPort: true,
        silent: true,
      });
      expect(replacement.port).to.eql(port);
    });
  });
});
