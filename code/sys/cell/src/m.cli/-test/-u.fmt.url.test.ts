import { describe, expect, it } from '../../-test.ts';
import { Cli, stripAnsi, type t } from '../common.ts';

describe('Cli.Fmt.Url', () => {
  it('orders the most base URL last', () => {
    const urls = [
      serviceUrl('http://localhost:8081/'),
      serviceUrl('http://localhost:8081/payments/'),
      serviceUrl('http://localhost:8081/view/'),
      serviceUrl('http://localhost:8081/-/stripe/'),
    ];

    expect(Cli.Fmt.Url.orderBaseLast(urls).map((url) => url.href)).to.eql([
      'http://localhost:8081/payments/',
      'http://localhost:8081/view/',
      'http://localhost:8081/-/stripe/',
      'http://localhost:8081/',
    ]);
  });

  it('prefers shallower paths, then shorter query/hash variants', () => {
    const urls = [
      serviceUrl('http://localhost:8081/view/'),
      serviceUrl('http://localhost:8081/?preview=true'),
      serviceUrl('http://localhost:8081/#status'),
      serviceUrl('http://localhost:8081/'),
    ];

    expect(Cli.Fmt.Url.orderBaseLast(urls).map((url) => url.href)).to.eql([
      'http://localhost:8081/view/',
      'http://localhost:8081/?preview=true',
      'http://localhost:8081/#status',
      'http://localhost:8081/',
    ]);
  });

  it('formats service URLs', () => {
    expect(
      stripAnsi(Cli.Fmt.Url.service(serviceUrl('http://localhost:8081/'), { highlightOrigin: true })),
    ).to.eql('http://localhost:8081/');
    expect(stripAnsi(Cli.Fmt.Url.service(serviceUrl('http://localhost:8081/payments/')))).to.eql(
      'http://localhost:8081/payments/',
    );
  });

  it('displays loopback IPv4 URLs as localhost', () => {
    expect(stripAnsi(Cli.Fmt.Url.service(serviceUrl('ws://127.0.0.1:5176/files')))).to.eql(
      'ws://localhost:5176/files',
    );
    expect(
      stripAnsi(Cli.Fmt.Url.service(serviceUrl('ws://127.0.0.1:5176/files'), { highlightOrigin: true })),
    ).to.eql('ws://localhost:5176/files');
  });
});

function serviceUrl(href: string): t.Service.Url {
  return { href: href as t.StringUrl };
}
