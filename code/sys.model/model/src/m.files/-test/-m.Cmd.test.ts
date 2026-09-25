import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Cmd } from '../m.Cmd.ts';
import { Files } from '../mod.ts';

describe('Files.Cmd', () => {
  it('API', () => {
    expect(Files.Cmd).to.equal(Cmd);
    expect(Cmd.ns).to.eql('sys.files');
    expect(Object.keys(Cmd).sort()).to.eql(['Name', 'make', 'ns']);
    expect(Cmd.Name).to.eql({
      capabilities: 'files:capabilities',
      list: 'files:list',
      stat: 'files:stat',
      read: 'files:read',
      write: 'files:write',
      remove: 'files:remove',
      watch: 'files:watch',
      manifest: 'files:manifest',
    });

    const factory = Cmd.make();
    expect(typeof factory.client).to.eql('function');
    expect(typeof factory.host).to.eql('function');

    expectTypeOf(Cmd).toEqualTypeOf<t.Files.Cmd.Lib>();
    expectTypeOf(Cmd.Name.list).toEqualTypeOf<t.Files.Cmd.Name.List>();
    expectTypeOf(Cmd.make).toEqualTypeOf<t.Files.Cmd.MakeFactory>();
    expectTypeOf(factory).toEqualTypeOf<t.Files.Cmd.Factory>();
  });

  it('make binds the Files Cmd namespace', async () => {
    const messages: t.Cmd.Wire.Request[] = [];
    const endpoint: t.Cmd.Endpoint = {
      postMessage(data) {
        messages.push(data as t.Cmd.Wire.Request);
      },
      addEventListener() {
        return undefined;
      },
      removeEventListener() {
        return undefined;
      },
    };
    const client = Cmd.make().client(endpoint);
    const done = client.send(Cmd.Name.capabilities, {}).catch(() => undefined);

    try {
      expect(messages[0]?.ns).to.eql(Cmd.ns);
      expect(messages[0]?.name).to.eql(Cmd.Name.capabilities);
    } finally {
      client.dispose();
      await done;
    }
  });
});
