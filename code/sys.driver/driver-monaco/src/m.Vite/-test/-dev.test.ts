import { Vite } from '@sys/driver-vite';
import { describe, expect, it, Testing } from '../../-test.ts';
import { Err, Fs, Time } from '../common.ts';

const cwd = Fs.Path.fromFileUrl(new URL('../../../', import.meta.url));
const REQUEST_TIMEOUT = 5_000;

describe('MonacoVite development serving', () => {
  it('development server → serves runtime assets and notices', async () => {
    const server = await Vite.dev({
      paths: {
        cwd,
        app: { entry: 'src/index.html', outDir: 'dist', base: './' },
      },
      port: Testing.randomPort(),
      strictPort: true,
      silent: true,
    });
    try {
      const request = async (path: string) => {
        const url = new URL(path, server.url);
        const startedAt = Time.now.timestamp;
        try {
          return await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT) });
        } catch (cause) {
          throw new Error(
            `MonacoVite development request failed: ${url.href} ` +
              `after ${Time.elapsed(startedAt).msec}ms (timeout ${REQUEST_TIMEOUT}ms).\n` +
              Err.summary(cause),
            { cause },
          );
        }
      };

      const [loader, license, thirdParty] = await Promise.all([
        request('vs/loader.js'),
        request('vs/LICENSE'),
        request('vs/ThirdPartyNotices.txt'),
      ]);

      expect(loader.status).to.eql(200);
      expect(loader.headers.get('cache-control')).to.eql('no-store');
      expect(loader.headers.get('content-type')).to.eql('text/javascript; charset=UTF-8');
      expect(loader.headers.get('x-content-type-options')).to.eql('nosniff');
      expect((await loader.text()).length).to.be.greaterThan(1_000);

      expect(license.status).to.eql(200);
      expect(await license.text()).to.include('The MIT License');
      expect(thirdParty.status).to.eql(200);
      expect((await thirdParty.text()).length).to.be.greaterThan(10_000);
    } finally {
      await server.dispose();
    }
  });
});
