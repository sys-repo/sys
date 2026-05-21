import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Client } from '../m.Client/mod.ts';
import { Files } from '../mod.ts';

describe('Files.Client', () => {
  it('API', () => {
    expect(Files.Client).to.equal(Client);
    expect(Object.keys(Client).sort()).to.eql(['websocket']);

    expectTypeOf(Client).toEqualTypeOf<t.FilesClient.Lib>();
    expectTypeOf(Client.websocket).toEqualTypeOf<t.FilesClient.Lib['websocket']>();
  });

  it('wraps open failures with Files client context', async () => {
    const url = 'not-a-websocket-url' as t.StringUrl;
    const error = await Client.websocket(url).catch((e: unknown) => e);

    expect(error).to.be.instanceOf(Error);
    expect((error as Error).name).to.eql('FilesClientError');
    expect((error as Error).message).to.eql(`Files.Client.websocket: failed to open ${url}`);
    expect((error as Error).cause).to.not.eql(undefined);
  });
});
