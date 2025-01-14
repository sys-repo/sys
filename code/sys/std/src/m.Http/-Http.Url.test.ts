import { Testing, describe, expect, it } from '../m.Testing.Server/mod.ts';
import { Http } from './mod.ts';

describe('Http.Url', () => {
  const TestHttp = Testing.HttpServer;

  describe('create', () => {
    it('create: factory methods', () => {
      const base = 'https://foo.com/v1';
      const a = Http.Url.create(base);
      const b = Http.url(base);
      expect(a.base).to.eql(base);
      expect(b.base).to.eql(base);
      expect(a.toString()).to.eql(base);
    });

    it('create: from net-addr', async () => {
      const server = TestHttp.server(() => new Response('foo'));
      const addr = server.addr;
      const url = Http.Url.fromAddr(addr);
      expect(url.base).to.eql(`http://0.0.0.0:${addr.port}/`);
      await server.dispose();
    });

    it('create: with trailing forward-slash', () => {
      const url = Http.url('https://foo.com');
      expect(url.base).to.eql('https://foo.com/');
    });

    it('create: localhost (http)', () => {
      const url = Http.url('http://localhost:8080');
      expect(url.base).to.eql('http://localhost:8080/');
    });

    it('throw: invalid URL', () => {
      const NON = ['foo', 123, false, null, undefined, {}, [], Symbol('foo'), BigInt(0)];
      NON.forEach((input: any) => {
        const fn = () => Http.url(input);
        expect(fn).to.throw(/Invalid base URL/);
      });
    });
  });

  it('Url.join', () => {
    const url = Http.url('https://foo.com/v1');
    expect(url.join('foo')).to.eql('https://foo.com/v1/foo');
    expect(url.join('/foo')).to.eql('https://foo.com/v1/foo');
    expect(url.join('///foo')).to.eql('https://foo.com/v1/foo');
    expect(url.join('foo/bar/')).to.eql('https://foo.com/v1/foo/bar/');
    expect(url.join('foo/bar?s=123')).to.eql('https://foo.com/v1/foo/bar?s=123');
  });
});
