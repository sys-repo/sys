import { describe, expect, it, type t } from '../../../-test.ts';
import { ServiceWorker } from '../mod.ts';
import { tombstoneAt } from '../u/u.tombstone.ts';
import { captureFailure, tombstoneFixture, withWorkerTarget } from './u.fixture.tombstone.ts';

describe('Http.ServiceWorker.tombstone', () => {
  describe('admission', () => {
    it('admitted location → returns exact classification without migration authority', () => {
      let authorityReads = 0;
      const target = Object.defineProperties(
        {},
        {
          location: { value: { href: 'https://example.com/app' } },
          caches: {
            get() {
              authorityReads += 1;
              throw new Error('caches-read');
            },
          },
        },
      ) as ServiceWorkerGlobalScope;
      const args = Object.defineProperty({}, 'pkg', {
        get() {
          authorityReads += 1;
          throw new Error('pkg-read');
        },
      }) as t.HttpServiceWorker.Tombstone.Args;

      expect(tombstoneAt(target, args)).to.eql({
        kind: 'admitted',
        deployment: 'https-non-loopback',
        origin: 'https://example.com',
      });
      expect(authorityReads).to.eql(0);
    });

    it('unclassifiable location → returns exact refusal without migration authority', () => {
      const cases = [
        [undefined, { kind: 'unsupported', reason: 'unknown-context' }],
        ['file:///worker.js', { kind: 'unsupported', reason: 'unsupported-protocol' }],
        ['not a url', { kind: 'failed', reason: 'invalid-url' }],
      ] as const;

      for (const [context, admission] of cases) {
        let authorityReads = 0;
        const target = Object.defineProperties(
          {},
          {
            location: { value: context },
            caches: {
              get() {
                authorityReads += 1;
                throw new Error('caches-read');
              },
            },
          },
        ) as ServiceWorkerGlobalScope;
        const args = Object.defineProperty({}, 'pkg', {
          get() {
            authorityReads += 1;
            throw new Error('pkg-read');
          },
        }) as t.HttpServiceWorker.Tombstone.Args;

        expect(tombstoneAt(target, args)).to.eql(admission);
        expect(authorityReads).to.eql(0);
      }
    });
  });

  describe('setup', () => {
    it('denied location → installs only migration lifecycle handlers', () => {
      const fixture = tombstoneFixture();
      const result = tombstoneAt(fixture.target, {
        pkg: { name: 'my-pkg', version: '1.0.0' },
      });

      expect(result).to.eql({
        kind: 'installed',
        admission: {
          kind: 'denied',
          reason: 'loopback',
          origin: 'http://127.0.0.1:8080',
        },
      });
      expect(Object.isFrozen(result)).to.eql(true);
      expect(fixture.listeners.has('install')).to.eql(true);
      expect(fixture.listeners.has('activate')).to.eql(true);
      expect(fixture.listeners.has('fetch')).to.eql(false);
      expect(fixture.listeners.has('message')).to.eql(false);
      expect(fixture.clientReads).to.eql(0);
    });

    it('invalid worker substrate → returns setup-failure', () => {
      const target = {
        location: { href: 'http://127.0.0.1:8080/sw.js' },
        caches: {},
        registration: {},
      } as ServiceWorkerGlobalScope;

      expect(tombstoneAt(target, { pkg: { name: 'my-pkg', version: '1.0.0' } })).to.eql({
        kind: 'failed',
        reason: 'setup-failure',
        admission: {
          kind: 'denied',
          reason: 'loopback',
          origin: 'http://127.0.0.1:8080',
        },
      });
    });

    it('listener setup failure → removes installed lifecycle handlers', () => {
      const fixture = tombstoneFixture({ failAdd: 'install' });

      const result = tombstoneAt(fixture.target, {
        pkg: { name: 'my-pkg', version: '1.0.0' },
      });

      expect(result.kind).to.eql('failed');
      expect(fixture.listeners.size).to.eql(0);
      expect(fixture.calls).to.contain('remove:install');
      expect(fixture.calls).to.contain('remove:activate');
    });
  });

  describe('lifecycle', () => {
    it('install → waits for skipWaiting', async () => {
      const fixture = tombstoneFixture();
      tombstoneAt(fixture.target, { pkg: { name: 'my-pkg', version: '1.0.0' } });

      await fixture.dispatch('install');

      expect(fixture.calls).to.contain('skipWaiting');
      expect(fixture.calls).to.contain('waitUntil:install');
    });

    it('activate → unregisters and removes every owned cache', async () => {
      const fixture = tombstoneFixture({
        names: [
          'my-pkg:asset-files',
          'my-pkg:media-files',
          'my-pkg:media-range-files',
          'my-pkg:obsolete',
          'my-pkg-legacy:asset-files',
          'my-pkg2:obsolete',
          'other:cache',
        ],
      });
      const pkg = { name: 'my-pkg', version: '1.0.0' };
      tombstoneAt(fixture.target, { pkg });
      pkg.name = 'redirected';

      await fixture.dispatch('activate');

      expect(fixture.deleted).to.eql([
        'my-pkg:asset-files',
        'my-pkg:media-files',
        'my-pkg:media-range-files',
        'my-pkg:obsolete',
      ]);
      expect(fixture.calls).to.contain('unregister');
      expect(fixture.calls).to.contain('waitUntil:activate');
    });

    it('unregister + cleanup rejection → preserves unregister failure identity', async () => {
      const unregisterFailure = new Error('unregister-failure');
      const keysFailure = new Error('keys-failure');
      const fixture = tombstoneFixture({
        unregister: () => Promise.reject(unregisterFailure),
        keys: () => Promise.reject(keysFailure),
      });
      tombstoneAt(fixture.target, { pkg: { name: 'my-pkg', version: '1.0.0' } });

      expect(await captureFailure(() => fixture.dispatch('activate'))).to.equal(unregisterFailure);
      expect(fixture.calls).to.contain('unregister');
      expect(fixture.calls).to.contain('keys');
    });

    it('cache deletion rejection → attempts every owned cache and preserves first failure', async () => {
      const first = new Error('delete-first');
      const second = new Error('delete-second');
      const fixture = tombstoneFixture({
        names: ['other:cache', 'my-pkg:obsolete-a', 'my-pkg:obsolete-b'],
        remove: (name) => Promise.reject(name.endsWith('-a') ? first : second),
      });
      tombstoneAt(fixture.target, { pkg: { name: 'my-pkg', version: '1.0.0' } });

      expect(await captureFailure(() => fixture.dispatch('activate'))).to.equal(first);
      expect(fixture.calls).to.contain('unregister');
      expect(fixture.deleted).to.eql(['my-pkg:obsolete-a', 'my-pkg:obsolete-b']);
    });
  });

  describe('public binding', () => {
    it('caller-supplied authority cannot override the actual worker global', () => {
      const fixture = tombstoneFixture();
      const result = withWorkerTarget(fixture.target, () =>
        ServiceWorker.tombstone({
          admission: ServiceWorker.admit('https://example.com/app'),
          pkg: { name: 'my-pkg', version: '1.0.0' },
          target: { location: { href: 'https://example.com/app' } },
        } as unknown as t.HttpServiceWorker.Tombstone.Args));

      expect(result).to.eql({
        kind: 'installed',
        admission: {
          kind: 'denied',
          reason: 'loopback',
          origin: 'http://127.0.0.1:8080',
        },
      });
      expect(Object.isFrozen(result)).to.eql(true);
    });
  });
});
