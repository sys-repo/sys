import { c, describe, expect, it, stripAnsi, type t } from '../../../-test.ts';
import { Fmt } from '../mod.ts';

describe('Cli.Fmt.ServiceUrl', () => {
  it('prepares pure display parts for service URLs', () => {
    const [part] = Fmt.ServiceUrl.parts([serviceUrl('http://127.0.0.1:8081/payments/?a=b#top')]);

    expect(part).to.eql({
      ok: true,
      href: 'http://127.0.0.1:8081/payments/?a=b#top',
      origin: 'http://localhost:8081',
      suffix: '/payments/?a=b#top',
      display: 'http://localhost:8081/payments/?a=b#top',
      port: '8081',
      highlightOrigin: true,
    });
  });

  it('prepares service URL parts with first-origin highlighting state', () => {
    const res = Fmt.ServiceUrl.parts([
      serviceUrl('http://127.0.0.1:5050/files'),
      serviceUrl('http://localhost:5050/files/manifest'),
    ]);

    expect(res.map((part) => ({ display: part.display, highlightOrigin: part.highlightOrigin })))
      .to.eql([
        { display: 'http://localhost:5050/files', highlightOrigin: true },
        { display: 'http://localhost:5050/files/manifest', highlightOrigin: false },
      ]);
  });

  it('formats service URLs', () => {
    const root = Fmt.ServiceUrl.format(
      serviceUrl('http://localhost:8081/'),
      { origin: 'highlight' },
    );
    expect(root).to.eql(
      `${c.cyan('http://localhost:')}${c.bold(c.cyan('8081'))}${c.cyan('/')}`,
    );
    expect(stripAnsi(root)).to.eql('http://localhost:8081/');
    expect(stripAnsi(Fmt.ServiceUrl.format(serviceUrl('http://localhost:8081/payments/')))).to.eql(
      'http://localhost:8081/payments/',
    );
  });

  it('formats service URL lists in owner order and highlights first unique origins', () => {
    const urls = [
      serviceUrl('ws://127.0.0.1:5050/files'),
      serviceUrl('http://127.0.0.1:5050/files/manifest'),
    ];

    const res = Fmt.ServiceUrl.formatList(urls);

    expect(res.map(stripAnsi)).to.eql([
      'ws://localhost:5050/files',
      'http://localhost:5050/files/manifest',
    ]);
    expect(res[0]).to.eql(
      `${c.cyan('ws://localhost:')}${c.bold(c.cyan('5050'))}${c.gray('/files')}`,
    );
    expect(res[1]).to.eql(
      `${c.cyan('http://localhost:')}${c.bold(c.cyan('5050'))}${c.gray('/files/manifest')}`,
    );
  });

  it('keeps repeated displayed origins gray after the first occurrence', () => {
    const urls = [
      serviceUrl('http://127.0.0.1:5050/files'),
      serviceUrl('http://localhost:5050/files/manifest'),
    ];

    const res = Fmt.ServiceUrl.formatList(urls);

    expect(res.map(stripAnsi)).to.eql([
      'http://localhost:5050/files',
      'http://localhost:5050/files/manifest',
    ]);
    expect(res[0]).to.eql(
      `${c.cyan('http://localhost:')}${c.bold(c.cyan('5050'))}${c.gray('/files')}`,
    );
    expect(res[1]).to.eql(
      `${c.gray('http://localhost:5050')}${c.gray('/files/manifest')}`,
    );
  });

  it('preserves interleaved URL order while highlighting new origins', () => {
    const urls = [
      serviceUrl('http://localhost:5050/'),
      serviceUrl('ws://localhost:5050/files'),
      serviceUrl('http://localhost:5050/files/manifest'),
    ];

    const res = Fmt.ServiceUrl.formatList(urls);

    expect(res.map(stripAnsi)).to.eql([
      'http://localhost:5050/',
      'ws://localhost:5050/files',
      'http://localhost:5050/files/manifest',
    ]);
    expect(res[0]).to.eql(
      `${c.cyan('http://localhost:')}${c.bold(c.cyan('5050'))}${c.cyan('/')}`,
    );
    expect(res[1]).to.eql(
      `${c.cyan('ws://localhost:')}${c.bold(c.cyan('5050'))}${c.gray('/files')}`,
    );
    expect(res[2]).to.eql(
      `${c.gray('http://localhost:5050')}${c.gray('/files/manifest')}`,
    );
  });

  it('displays loopback IPv4 URLs as localhost', () => {
    expect(stripAnsi(Fmt.ServiceUrl.format(serviceUrl('ws://127.0.0.1:5176/files')))).to.eql(
      'ws://localhost:5176/files',
    );
    expect(
      stripAnsi(
        Fmt.ServiceUrl.format(serviceUrl('ws://127.0.0.1:5176/files'), { origin: 'highlight' }),
      ),
    )
      .to.eql('ws://localhost:5176/files');
  });

  it('preserves exact IPv4 loopback display across every formatter entrypoint', () => {
    const url = serviceUrl('http://127.0.0.1:5176/files');
    const options = { ipv4Loopback: 'exact' } as const;
    const [part] = Fmt.ServiceUrl.parts([url], options);

    expect(part?.display).to.eql('http://127.0.0.1:5176/files');
    expect(stripAnsi(Fmt.ServiceUrl.format(url, options))).to.eql('http://127.0.0.1:5176/files');
    expect(stripAnsi(Fmt.ServiceUrl.format(part!))).to.eql('http://127.0.0.1:5176/files');
    expect(stripAnsi(Fmt.ServiceUrl.formatList([url], options)[0])).to.eql(
      'http://127.0.0.1:5176/files',
    );
  });
});

function serviceUrl(href: string): t.Service.Url {
  return { href: href as t.StringUrl };
}
