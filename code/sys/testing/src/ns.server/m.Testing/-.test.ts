import { type t, describe, it, expect } from '../-test.ts';
import { Testing } from './mod.ts';

describe('Server ← test helpers', () => {
  describe('API', () => {
    it('base: std (includes HTTP)', async () => {
      const m = await import('@sys/std/testing/server');
      const props = Object.keys(m.Testing) as (keyof typeof m.Testing)[];
      props.forEach((key) => expect(Testing[key]).to.equal(m.Testing[key]));
    });
  });

  describe('files-system: dir', () => {});

  describe('connect', () => {
    it('refused when the port is closed', async () => {
      const port = Testing.randomPort();
      const conn = await Testing.connect(port);
      expect(conn.refused).to.eql(true);
      expect(conn.error?.message).to.include('Connection refused');
      expect(conn.error?.name).to.eql('ConnectionRefused');
    });

    it('ok when the port is open', async () => {
      const test = async (hostname?: string) => {
        const port = Testing.randomPort();
        const listener = Deno.listen({ hostname, port });

        try {
          const conn = await Testing.connect(port);
          expect(conn.ok).to.eql(true);
          expect(conn.refused).to.eql(false);
          expect(conn.address.remote!.port).to.eql(port);
          expect(conn.address.remote!.hostname).to.eql('127.0.0.1');
        } finally {
          listener.close();
        }
      };

      await test();
      await test('127.0.0.1');
      await test('localhost');
    });
  });
});
