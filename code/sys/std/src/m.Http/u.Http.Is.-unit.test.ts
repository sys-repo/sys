import { Testing, describe, expect, it } from '../m.Testing.HttpServer/mod.ts';
import { Http } from './mod.ts';

describe('Http.Is', () => {
  const TestHttp = Testing.HttpServer;

  it('Is.netaddr: false', () => {
    const NON = ['foo', 123, false, null, undefined, {}, [], Symbol('foo'), BigInt(0)];
    NON.forEach((v) => expect(Http.Is.netaddr(v)).to.eql(false));
  });

  it('Is.netaddr: true', async () => {
    const server = TestHttp.server();
    expect(Http.Is.netaddr(server.addr)).to.eql(true);
    await server.dispose();
  });
});
