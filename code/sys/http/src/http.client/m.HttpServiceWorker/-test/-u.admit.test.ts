import { describe, expect, it } from '../../../-test.ts';
import { ServiceWorker } from '../mod.ts';

describe('Http.ServiceWorker.admit', () => {
  describe('admission', () => {
    it('HTTPS non-loopback URL → returns a frozen canonical origin', () => {
      const result = ServiceWorker.admit('https://example.com:443/app?mode=public#view');

      expect(result).to.eql({
        kind: 'admitted',
        deployment: 'https-non-loopback',
        origin: 'https://example.com',
      });
      expect(Object.isFrozen(result)).to.eql(true);
    });

    it('does not equate non-loopback syntax with public reachability', () => {
      expect(ServiceWorker.admit('https://10.0.0.1/app')).to.eql({
        kind: 'admitted',
        deployment: 'https-non-loopback',
        origin: 'https://10.0.0.1',
      });
    });

    it('does not mislabel a numeric-looking DNS name as loopback', () => {
      expect(ServiceWorker.admit('https://127.example.com/app')).to.eql({
        kind: 'admitted',
        deployment: 'https-non-loopback',
        origin: 'https://127.example.com',
      });
    });
  });

  describe('input snapshot', () => {
    it('caller mutation cannot alter the classified href', () => {
      const context = { href: 'https://example.com/app' };
      const result = ServiceWorker.admit(context);
      context.href = 'http://localhost:8080/redirected';

      expect(result).to.eql({
        kind: 'admitted',
        deployment: 'https-non-loopback',
        origin: 'https://example.com',
      });
    });

    it('URL-like href → reads once', () => {
      let reads = 0;
      const context = {
        get href() {
          reads += 1;
          return reads === 1 ? 'https://example.com/app' : 'http://localhost:8080/redirected';
        },
      };

      expect(ServiceWorker.admit(context)).to.eql({
        kind: 'admitted',
        deployment: 'https-non-loopback',
        origin: 'https://example.com',
      });
      expect(reads).to.eql(1);
    });

    it('URL adapter → reads, calls, and snapshots returned href once', () => {
      let adapterReads = 0;
      let calls = 0;
      let hrefReads = 0;
      const context = {
        get toURL() {
          adapterReads += 1;
          return () => {
            calls += 1;
            return Object.defineProperty(new URL('https://example.com/app'), 'href', {
              get() {
                hrefReads += 1;
                return 'https://example.com/app';
              },
            });
          };
        },
      };

      expect(ServiceWorker.admit(context)).to.eql({
        kind: 'admitted',
        deployment: 'https-non-loopback',
        origin: 'https://example.com',
      });
      expect({ adapterReads, calls, hrefReads }).to.eql({
        adapterReads: 1,
        calls: 1,
        hrefReads: 1,
      });
    });

    it('throwing URL-like access → returns invalid-url', () => {
      const href = Object.defineProperty({}, 'href', {
        get() {
          throw new Error('hostile-href');
        },
      });
      const adapter = {
        toURL() {
          return Object.defineProperty({}, 'href', {
            get() {
              throw new Error('hostile-adapter-href');
            },
          });
        },
      };

      expect(ServiceWorker.admit(href as never)).to.eql({
        kind: 'failed',
        reason: 'invalid-url',
      });
      expect(ServiceWorker.admit(adapter as never)).to.eql({
        kind: 'failed',
        reason: 'invalid-url',
      });
    });
  });

  describe('classification boundary', () => {
    it('loopback → denied before evaluating HTTPS', () => {
      const inputs = [
        'http://localhost:8080/app',
        'https://localhost/app',
        'https://localhost./app',
        'https://localhost../app',
        'https://ui.localhost/app',
        'https://127.0.0.1/app',
        'https://127.1/app',
        'https://127.42.0.7/app',
        'https://127.0xffffff/app',
        'https://0x7f000001/app',
        'https://017700000001/app',
        'https://2130706433/app',
        'https://[::1]/app',
        'https://[::ffff:127.42.0.7]/app',
        'https://[::ffff:7f00:1]/app',
        'https://[0:0:0:0:0:ffff:7f00:1]/app',
        'https://[::127.42.0.7]/app',
      ];

      for (const input of inputs) {
        const result = ServiceWorker.admit(input);
        expect(result.kind).to.eql('denied', input);
        if (result.kind === 'denied') expect(result.reason).to.eql('loopback', input);
      }
    });

    it('non-HTTPS non-loopback origin → denied', () => {
      expect(ServiceWorker.admit('http://example.com/app')).to.eql({
        kind: 'denied',
        reason: 'non-https',
        origin: 'http://example.com',
      });
    });

    it('absent and non-URL context → unsupported', () => {
      expect(ServiceWorker.admit()).to.eql({
        kind: 'unsupported',
        reason: 'unknown-context',
      });
      expect(ServiceWorker.admit(42 as never)).to.eql({
        kind: 'unsupported',
        reason: 'unknown-context',
      });
    });

    it('non-HTTP protocol → unsupported', () => {
      expect(ServiceWorker.admit('file:///tmp/index.html')).to.eql({
        kind: 'unsupported',
        reason: 'unsupported-protocol',
      });
    });

    it('non-canonical or malformed URL text → invalid-url', () => {
      const inputs = [
        '/relative/app',
        'https:example.com/app',
        ' https://example.com/app',
        'not a url',
      ];

      for (const input of inputs) {
        expect(ServiceWorker.admit(input)).to.eql({
          kind: 'failed',
          reason: 'invalid-url',
        });
      }
    });
  });
});
