import { describe, expect, it } from '../-test.ts';
import { Testing } from '../m.Testing.Server/mod.ts';
import { Url } from './mod.ts';

describe('Url', () => {
  describe('create', () => {
    it('create: factory methods', () => {
      const base = 'https://foo.com/v1';
      const url = Url.create(base);
      expect(url.base).to.eql(base);
      expect(url.toString()).to.eql(base);
    });

    it('create: from net-addr', async () => {
      const server = Testing.Http.server(() => new Response('foo'));
      const addr = server.addr;
      const url = Url.fromAddr(addr);
      expect(url.base).to.eql(`http://0.0.0.0:${addr.port}/`);
      await server.dispose();
    });

    it('create: with trailing forward-slash', () => {
      const url = Url.create('https://foo.com');
      expect(url.base).to.eql('https://foo.com/');
    });

    it('create: localhost (http)', () => {
      const url = Url.create('http://localhost:8080');
      expect(url.base).to.eql('http://localhost:8080/');
    });

    it('throw: invalid URL', () => {
      const NON = ['foo', 123, false, null, undefined, {}, [], Symbol('foo'), BigInt(0)];
      NON.forEach((input: any) => {
        const fn = () => Url.create(input);
        expect(fn).to.throw(/Invalid base URL/);
      });
    });
  });

  it('Url.join', () => {
    const url = Url.create('https://foo.com/v1');
    expect(url.join('foo')).to.eql('https://foo.com/v1/foo');
    expect(url.join('/foo')).to.eql('https://foo.com/v1/foo');
    expect(url.join('///foo')).to.eql('https://foo.com/v1/foo');
    expect(url.join('foo/bar/')).to.eql('https://foo.com/v1/foo/bar/');
    expect(url.join('foo/bar?s=123')).to.eql('https://foo.com/v1/foo/bar?s=123');
  });
});
