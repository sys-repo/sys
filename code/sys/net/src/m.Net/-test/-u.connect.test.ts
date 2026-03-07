import { describe, expect, it, Testing } from '../../-test.ts';
import { Net, Port } from '../mod.ts';

describe('Net.connect', () => {
  it('connects to a listening port', async () => {
    await Testing.retry(3, async () => {
      const port = Port.random();
      const listener = Deno.listen({ port });

      const res = await Net.connect(port, { attempts: 3 });
      expect(res.error).to.eql(undefined);
      expect(res.socket).to.not.eql(undefined);

      const socket = res.socket!;
      expect(socket.remoteAddr.port).to.eql(port);

      socket.close();
      listener.close();
    });
  });

  it('returns an error when the port is unreachable', async () => {
    await Testing.retry(3, async () => {
      const port = Port.random();
      const res = await Net.connect(port, { attempts: 2, delay: 10 });

      expect(res.socket).to.eql(undefined);
      expect(res.error?.name).to.eql('ConnectionRefused');
      expect(res.error?.message).to.include('Connection refused');
    });
  });
});
