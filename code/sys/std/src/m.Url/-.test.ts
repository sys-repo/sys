import { describe, expect, it } from '../-test.ts';
import { Testing } from '../m.Testing.Server/mod.ts';
import { Url } from './mod.ts';

describe('Url', () => {
  describe('parse', () => {
    it('parse: factory methods', () => {
      const base = 'https://foo.com/v1';
      const url = Url.parse(base);
      expect(url.base).to.eql(base);
      expect(url.toString()).to.eql(base);
    });

    it('parse: from net-addr', async () => {
      const server = Testing.Http.server(() => new Response('foo'));
      const addr = server.addr;
      const url = Url.parse(addr);
      expect(url.base).to.eql(`http://0.0.0.0:${addr.port}/`);
      await server.dispose();
    });

    it('parse: with trailing forward-slash', () => {
      const url = Url.parse('https://foo.com');
      expect(url.base).to.eql('https://foo.com/');
    });

    it('parse: localhost (http)', () => {
      const url = Url.parse('http://localhost:8080');
      expect(url.base).to.eql('http://localhost:8080/');
    });

    it('throw: invalid URL', () => {
      const NON = ['foo', 123, false, null, undefined, {}, [], Symbol('foo'), BigInt(0)];
      NON.forEach((input: any) => {
        const fn = () => Url.parse(input);
        expect(fn).to.throw(/Invalid base URL/);
      });
    });
  });

  it('Url.join', () => {
    const url = Url.parse('https://foo.com/v1');
    expect(url.join('foo')).to.eql('https://foo.com/v1/foo');
    expect(url.join('/foo')).to.eql('https://foo.com/v1/foo');
    expect(url.join('///foo')).to.eql('https://foo.com/v1/foo');
    expect(url.join('foo/bar/')).to.eql('https://foo.com/v1/foo/bar/');
    expect(url.join('foo/bar?s=123')).to.eql('https://foo.com/v1/foo/bar?s=123');
  });

  it('Url.toObject', () => {
    const href = 'https://foo.com/v1?d=true#123';
    const url = Url.parse(href);
    expect(url.toObject().href).to.eql(href);
  });
});
