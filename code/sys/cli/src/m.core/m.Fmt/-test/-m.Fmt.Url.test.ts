import { c, describe, expect, it, stripAnsi, type t } from '../../../-test.ts';
import { Fmt } from '../mod.ts';

describe('Cli.Fmt.Url', () => {
  it('formats service URLs', () => {
    expect(
      stripAnsi(Fmt.Url.service(serviceUrl('http://localhost:8081/'), { highlightOrigin: true })),
    )
      .to.eql('http://localhost:8081/');
    expect(stripAnsi(Fmt.Url.service(serviceUrl('http://localhost:8081/payments/')))).to.eql(
      'http://localhost:8081/payments/',
    );
  });

  it('formats service URL lists in owner order', () => {
    const urls = [
      serviceUrl('ws://127.0.0.1:5050/files'),
      serviceUrl('http://127.0.0.1:5050/files/manifest'),
    ];

    const res = Fmt.Url.serviceList(urls);

    expect(res.map(stripAnsi)).to.eql([
      'ws://localhost:5050/files',
      'http://localhost:5050/files/manifest',
    ]);
    expect(res[0]).to.eql(
      `${c.cyan('ws://localhost:')}${c.bold(c.cyan('5050'))}${c.gray('/files')}`,
    );
    expect(res[1]).to.eql(
      `${c.gray('http://localhost:5050')}${c.gray('/files/manifest')}`,
    );
    expect(res.join('\n')).to.not.contain(c.dim(c.gray('http://localhost:5050')));
  });

  it('displays loopback IPv4 URLs as localhost', () => {
    expect(stripAnsi(Fmt.Url.service(serviceUrl('ws://127.0.0.1:5176/files')))).to.eql(
      'ws://localhost:5176/files',
    );
    expect(
      stripAnsi(
        Fmt.Url.service(serviceUrl('ws://127.0.0.1:5176/files'), { highlightOrigin: true }),
      ),
    )
      .to.eql('ws://localhost:5176/files');
  });
});

function serviceUrl(href: string): t.Service.Url {
  return { href: href as t.StringUrl };
}
