import { describe, expect, Fs, it, type t } from '../../-test.ts';
import { Vite } from '../common.ts';
import { dev } from '../u.dev.ts';

describe('ViteEntry.dev', () => {
  it('appends a package subpath to the dev-server display identity', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-vite.entry.dev.test.' })).absolute;
    const original = Vite.dev;
    const stop = new Error('Vite.dev captured');
    let seen: t.Vite.Dev.Args | undefined;

    Object.defineProperty(Vite, 'dev', {
      value: (args: t.Vite.Dev.Args) => {
        seen = args;
        throw stop;
      },
    });

    try {
      await Fs.write(
        Fs.join(cwd, 'deno.json'),
        '{"name":"@sys/example","version":"1.2.3"}\n',
      );

      let error: unknown;
      try {
        await dev({ cmd: 'dev', dir: cwd, 'pkg-subpath': 'ui' });
      } catch (cause) {
        error = cause;
      }

      expect(error).to.equal(stop);
      expect(seen?.pkg?.name).to.eql('@sys/example/ui');
      expect(seen?.pkg?.version).to.eql('1.2.3');
    } finally {
      Object.defineProperty(Vite, 'dev', { value: original });
      await Fs.remove(cwd);
    }
  });
});
