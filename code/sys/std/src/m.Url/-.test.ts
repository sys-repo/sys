import { describe, expect, it } from '../-test.ts';
import { Testing } from '../m.Testing.Server/mod.ts';
import { Url } from './mod.ts';

describe('Url', () => {
  describe('parse', () => {
    it('parse: factory methods', () => {
      const raw = 'https://foo.com/v1';
      const url = Url.parse(raw);
      expect(url.ok).to.eql(true);
      expect(url.error).to.eql(undefined);
      expect(url.raw).to.eql(raw);
      expect(url.toString()).to.eql(raw);
      expect(url.href).to.eql(url.toString());
      expect(url.toURL()).to.eql(new URL(raw));
    });

    it('parse: from net-addr', async () => {
      const server = Testing.Http.server(() => new Response('foo'));
      const addr = server.addr;
      const url = Url.parse(addr);
      expect(url.ok).to.eql(true);
      expect(url.error).to.eql(undefined);
      expect(url.raw).to.eql(`http://0.0.0.0:${addr.port}/`);
      await server.dispose();
    });

    it('parse: with trailing forward-slash', () => {
      const url = Url.parse('https://foo.com');
      expect(url.raw).to.eql('https://foo.com/');
      expect(url.ok).to.eql(true);
      expect(url.error).to.eql(undefined);
    });

    it('parse: localhost (http)', () => {
      const url = Url.parse('http://localhost:8080');
      expect(url.raw).to.eql('http://localhost:8080/');
      expect(url.ok).to.eql(true);
      expect(url.error).to.eql(undefined);
    });

    it('error: invalid URL', () => {
      const NON = ['foo', 123, false, null, undefined, {}, [], Symbol('foo'), BigInt(0)];
      NON.forEach((input: any) => {
        const url = Url.parse(input);
        expect(url.ok).to.eql(false);
        expect(url.error?.message).to.include('Invalid base URL');
        expect(url.raw).to.eql(String(input));
        expect(url.toURL()).to.eql(new URL('about:blank')); // NB: stand-in for failed URL.
      });

      expect(Url.parse('').error?.message).to.include('Invalid base URL: <empty>');
    });

    it('error: parse string', () => {
      const url = Url.parse('Room: Foobar');
      expect(url.ok).to.eql(false);
      expect(url.error?.message).to.include('Invalid base URL');
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
    expect(url.toURL().href).to.eql(href);
  });
});
