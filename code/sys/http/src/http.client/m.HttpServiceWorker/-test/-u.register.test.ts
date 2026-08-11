import { describe, expect, it, type t } from '../../../-test.ts';
import { ServiceWorker } from '../mod.ts';
import { type RegistrationContainer, withBrowser } from './u.fixture.browser.ts';

describe('Http.ServiceWorker.register', () => {
  describe('admission', () => {
    it('caller context cannot override the actual browser location', async () => {
      let calls = 0;
      const serviceWorker = {
        controller: null,
        register() {
          calls += 1;
          const registration = { scope: 'http://localhost:8080/' } as ServiceWorkerRegistration;
          return Promise.resolve(registration);
        },
      } as RegistrationContainer;

      const result = await withBrowser(
        { context: { href: 'http://localhost:8080/app' }, serviceWorker },
        () =>
          ServiceWorker.register({
            context: 'https://example.com/app',
            scriptUrl: '/sw.js',
          } as unknown as t.HttpServiceWorker.Register.Args),
      );

      expect(result).to.eql({
        kind: 'denied',
        reason: 'loopback',
        origin: 'http://localhost:8080',
      });
      expect(calls).to.eql(0);
    });

    it('denied location → does not read registration input or authority', async () => {
      let scriptReads = 0;
      let optionsReads = 0;
      let authorityReads = 0;
      const args = {
        get scriptUrl() {
          scriptReads += 1;
          throw new Error('script-access');
        },
        get options() {
          optionsReads += 1;
          throw new Error('options-access');
        },
      } as unknown as t.HttpServiceWorker.Register.Args;

      const result = await withBrowser(
        {
          context: { href: 'http://localhost:8080/app' },
          serviceWorkerGetter() {
            authorityReads += 1;
            throw new Error('registration-authority-access');
          },
        },
        () => ServiceWorker.register(args),
      );

      expect(result).to.eql({
        kind: 'denied',
        reason: 'loopback',
        origin: 'http://localhost:8080',
      });
      expect(scriptReads).to.eql(0);
      expect(optionsReads).to.eql(0);
      expect(authorityReads).to.eql(0);
    });

    it('unknown location → does not read registration authority', async () => {
      let authorityReads = 0;
      const result = await withBrowser(
        {
          context: undefined,
          serviceWorkerGetter() {
            authorityReads += 1;
            throw new Error('registration-authority-access');
          },
        },
        () => ServiceWorker.register({ scriptUrl: '/sw.js' }),
      );

      expect(result).to.eql({ kind: 'unsupported', reason: 'unknown-context' });
      expect(authorityReads).to.eql(0);
    });

    it('throwing location getter → fails before reading registration authority', async () => {
      let authorityReads = 0;
      const result = await withBrowser(
        {
          locationGetter() {
            throw new Error('location-getter');
          },
          serviceWorkerGetter() {
            authorityReads += 1;
            throw new Error('registration-authority-access');
          },
        },
        () => ServiceWorker.register({ scriptUrl: '/sw.js' }),
      );

      expect(result).to.eql({ kind: 'failed', reason: 'invalid-url' });
      expect(authorityReads).to.eql(0);
    });

    it('actual browser location → reads once', async () => {
      let reads = 0;
      const serviceWorker = {
        controller: null,
        register() {
          return Promise.resolve({
            scope: 'https://example.com/app/',
          } as ServiceWorkerRegistration);
        },
      } as RegistrationContainer;

      const result = await withBrowser(
        {
          locationGetter() {
            reads += 1;
            if (reads > 1) throw new Error('location-reread');
            return { href: 'https://example.com/app' };
          },
          serviceWorker,
        },
        () => ServiceWorker.register({ scriptUrl: '/sw.js' }),
      );

      expect(result.kind).to.eql('registered');
      expect(reads).to.eql(1);
    });
  });

  describe('input snapshot', () => {
    it('script URL → reads once before browser registration', async () => {
      let reads = 0;
      const scriptUrl = {
        get href() {
          reads += 1;
          return reads === 1 ? 'https://example.com/sw.js' : 'https://attacker.test/sw.js';
        },
      };
      const serviceWorker = {
        controller: null,
        register(input: string | URL) {
          expect(input).to.eql('https://example.com/sw.js');
          return Promise.resolve({ scope: 'https://example.com/' } as ServiceWorkerRegistration);
        },
      } as RegistrationContainer;

      const result = await withBrowser(
        { context: { href: 'https://example.com/' }, serviceWorker },
        () => ServiceWorker.register({ scriptUrl }),
      );

      expect(result.kind).to.eql('registered');
      expect(reads).to.eql(1);
    });

    it('registration options → reads each admitted field once', async () => {
      let scopeReads = 0;
      let typeReads = 0;
      let updateReads = 0;
      const options = Object.defineProperties(
        {},
        {
          scope: {
            get() {
              scopeReads += 1;
              return scopeReads === 1 ? '/app/' : '/redirected/';
            },
          },
          type: {
            get() {
              typeReads += 1;
              return typeReads === 1 ? 'module' : 'classic';
            },
          },
          updateViaCache: {
            get() {
              updateReads += 1;
              return updateReads === 1 ? 'none' : 'all';
            },
          },
        },
      ) as RegistrationOptions;
      const calls: unknown[][] = [];
      const serviceWorker = {
        controller: null,
        register(scriptUrl: string | URL, input?: RegistrationOptions) {
          calls.push([scriptUrl, input]);
          return Promise.resolve({
            scope: 'https://example.com/app/',
          } as ServiceWorkerRegistration);
        },
      } as RegistrationContainer;

      const result = await withBrowser(
        { context: { href: 'https://example.com/app' }, serviceWorker },
        () => ServiceWorker.register({ scriptUrl: '/sw.js', options }),
      );

      expect(result.kind).to.eql('registered');
      expect(calls).to.eql([
        ['/sw.js', { scope: '/app/', type: 'module', updateViaCache: 'none' }],
      ]);
      expect(scopeReads).to.eql(1);
      expect(typeReads).to.eql(1);
      expect(updateReads).to.eql(1);
    });

    it('registration options → passes one frozen value snapshot', async () => {
      const calls: unknown[][] = [];
      const serviceWorker = {
        controller: null,
        register(scriptUrl: string | URL, options?: RegistrationOptions) {
          calls.push([scriptUrl, options]);
          return Promise.resolve({
            scope: 'https://example.com/app/',
          } as ServiceWorkerRegistration);
        },
      } as RegistrationContainer;
      const options: RegistrationOptions = {
        scope: '/app/',
        type: 'module',
        updateViaCache: 'none',
      };

      await withBrowser(
        { context: { href: 'https://example.com/app' }, serviceWorker },
        () =>
          ServiceWorker.register({
            scriptUrl: new URL('https://example.com/sw.js'),
            options,
          }),
      );
      options.scope = '/redirected/';

      expect(calls).to.eql([
        [
          'https://example.com/sw.js',
          { scope: '/app/', type: 'module', updateViaCache: 'none' },
        ],
      ]);
      expect(Object.isFrozen(calls[0]?.[1])).to.eql(true);
    });

    it('malformed options → fails before browser registration', async () => {
      let calls = 0;
      const serviceWorker = {
        controller: null,
        register() {
          calls += 1;
          return Promise.resolve({ scope: 'https://example.com/' } as ServiceWorkerRegistration);
        },
      } as RegistrationContainer;
      const malformed = [
        null,
        42,
        { scope: 42 },
        { type: 'worker' },
        { updateViaCache: 'sometimes' },
      ];

      await withBrowser(
        { context: { href: 'https://example.com/' }, serviceWorker },
        async () => {
          for (const options of malformed) {
            const result = await ServiceWorker.register({
              scriptUrl: '/sw.js',
              options: options as t.HttpServiceWorker.Register.Options,
            });
            expect(result.kind).to.eql('failed');
            if (result.kind === 'failed') {
              expect(result.reason).to.eql('invalid-registration-options');
            }
          }
        },
      );
      expect(calls).to.eql(0);
    });

    it('throwing script getter → fails before reading registration authority', async () => {
      let authorityReads = 0;
      const result = await withBrowser(
        {
          context: { href: 'https://example.com/' },
          serviceWorkerGetter() {
            authorityReads += 1;
            throw new Error('registration-authority-access');
          },
        },
        () =>
          ServiceWorker.register({
            get scriptUrl() {
              throw new Error('script-getter');
            },
          } as unknown as t.HttpServiceWorker.Register.Args),
      );

      expect(result.kind).to.eql('failed');
      if (result.kind === 'failed') expect(result.reason).to.eql('invalid-script-url');
      expect(authorityReads).to.eql(0);
    });

    it('throwing options getter → fails before reading registration authority', async () => {
      let authorityReads = 0;
      const result = await withBrowser(
        {
          context: { href: 'https://example.com/' },
          serviceWorkerGetter() {
            authorityReads += 1;
            throw new Error('registration-authority-access');
          },
        },
        () =>
          ServiceWorker.register({
            scriptUrl: '/sw.js',
            get options() {
              throw new Error('options-getter');
            },
          } as t.HttpServiceWorker.Register.Args),
      );

      expect(result.kind).to.eql('failed');
      if (result.kind === 'failed') {
        expect(result.reason).to.eql('invalid-registration-options');
      }
      expect(authorityReads).to.eql(0);
    });

    it('invalid script input → fails before browser registration', async () => {
      let calls = 0;
      const serviceWorker = {
        controller: null,
        register() {
          calls += 1;
          return Promise.resolve({ scope: 'https://example.com/' } as ServiceWorkerRegistration);
        },
      } as RegistrationContainer;

      const result = await withBrowser(
        { context: { href: 'https://example.com/' }, serviceWorker },
        () => ServiceWorker.register({ scriptUrl: 42 as never }),
      );

      expect(result.kind).to.eql('failed');
      if (result.kind === 'failed') expect(result.reason).to.eql('invalid-script-url');
      expect(calls).to.eql(0);
    });
  });

  describe('registration substrate', () => {
    it('missing authority → returns unsupported', async () => {
      const result = await withBrowser(
        { context: { href: 'https://example.com/app' }, serviceWorker: {} },
        () => ServiceWorker.register({ scriptUrl: '/sw.js' }),
      );

      expect(result).to.eql({
        kind: 'unsupported',
        reason: 'service-worker-unavailable',
        admission: {
          kind: 'admitted',
          deployment: 'https-non-loopback',
          origin: 'https://example.com',
        },
      });
    });

    it('registration authority and method → read once', async () => {
      let authorityReads = 0;
      let registerReads = 0;
      const serviceWorker = Object.defineProperties(
        { controller: null },
        {
          register: {
            get() {
              registerReads += 1;
              if (registerReads > 1) throw new Error('register-reread');
              return () =>
                Promise.resolve({ scope: 'https://example.com/' } as ServiceWorkerRegistration);
            },
          },
        },
      ) as RegistrationContainer;

      const result = await withBrowser(
        {
          context: { href: 'https://example.com/' },
          serviceWorkerGetter() {
            authorityReads += 1;
            return serviceWorker;
          },
        },
        () => ServiceWorker.register({ scriptUrl: '/sw.js' }),
      );

      expect(result.kind).to.eql('registered');
      expect(authorityReads).to.eql(1);
      expect(registerReads).to.eql(1);
    });

    it('throwing authority getter → returns registration-substrate-failure', async () => {
      const result = await withBrowser(
        {
          context: { href: 'https://example.com/' },
          serviceWorkerGetter() {
            throw new Error('service-worker-getter');
          },
        },
        () => ServiceWorker.register({ scriptUrl: '/sw.js' }),
      );

      expect(result).to.eql({
        kind: 'failed',
        reason: 'registration-substrate-failure',
        admission: {
          kind: 'admitted',
          deployment: 'https-non-loopback',
          origin: 'https://example.com',
        },
      });
    });
  });

  describe('registration outcome', () => {
    it('verified registration → returns a frozen observation', async () => {
      const serviceWorker = {
        controller: null,
        register() {
          return Promise.resolve({
            scope: 'https://example.com/app/',
          } as ServiceWorkerRegistration);
        },
      } as RegistrationContainer;

      const result = await withBrowser(
        { context: { href: 'https://example.com/app' }, serviceWorker },
        () => ServiceWorker.register({ scriptUrl: '/sw.js' }),
      );

      expect(result).to.eql({
        kind: 'registered',
        admission: {
          kind: 'admitted',
          deployment: 'https-non-loopback',
          origin: 'https://example.com',
        },
        scope: 'https://example.com/app/',
        controller: 'absent',
      });
      expect(Object.isFrozen(result)).to.eql(true);
    });

    it('reported scope → reads once', async () => {
      let reads = 0;
      const registration = Object.defineProperty({}, 'scope', {
        get() {
          reads += 1;
          if (reads > 1) throw new Error('scope-reread');
          return 'https://example.com/app/';
        },
      }) as ServiceWorkerRegistration;
      const serviceWorker = {
        controller: null,
        register() {
          return Promise.resolve(registration);
        },
      } as RegistrationContainer;

      const result = await withBrowser(
        { context: { href: 'https://example.com/app' }, serviceWorker },
        () => ServiceWorker.register({ scriptUrl: '/sw.js' }),
      );

      expect(result.kind).to.eql('registered');
      expect(reads).to.eql(1);
    });

    it('browser rejection → returns registration-rejected', async () => {
      const serviceWorker = {
        controller: null,
        register() {
          return Promise.reject(new Error('browser-private-registration-failure'));
        },
      } as RegistrationContainer;

      const result = await withBrowser(
        { context: { href: 'https://example.com/' }, serviceWorker },
        () => ServiceWorker.register({ scriptUrl: '/sw.js' }),
      );

      expect(result).to.eql({
        kind: 'failed',
        reason: 'registration-rejected',
        admission: {
          kind: 'admitted',
          deployment: 'https-non-loopback',
          origin: 'https://example.com',
        },
      });
    });

    it('throwing scope getter → returns registration-unverified', async () => {
      const serviceWorker = {
        controller: null,
        register() {
          const registration = Object.defineProperty({}, 'scope', {
            get() {
              throw new Error('scope-getter');
            },
          }) as ServiceWorkerRegistration;
          return Promise.resolve(registration);
        },
      } as RegistrationContainer;

      const result = await withBrowser(
        { context: { href: 'https://example.com/' }, serviceWorker },
        () => ServiceWorker.register({ scriptUrl: '/sw.js' }),
      );

      expect(result).to.eql({
        kind: 'failed',
        reason: 'registration-unverified',
        admission: {
          kind: 'admitted',
          deployment: 'https-non-loopback',
          origin: 'https://example.com',
        },
      });
    });

    it('non-string scope → returns registration-unverified', async () => {
      const serviceWorker = {
        controller: null,
        register() {
          return Promise.resolve({ scope: 42 } as unknown as ServiceWorkerRegistration);
        },
      } as RegistrationContainer;

      const result = await withBrowser(
        { context: { href: 'https://example.com/' }, serviceWorker },
        () => ServiceWorker.register({ scriptUrl: '/sw.js' }),
      );

      expect(result).to.eql({
        kind: 'failed',
        reason: 'registration-unverified',
        admission: {
          kind: 'admitted',
          deployment: 'https-non-loopback',
          origin: 'https://example.com',
        },
      });
    });
  });

  describe('controller observation', () => {
    it('present controller → reports present after verified registration', async () => {
      const serviceWorker = {
        controller: {} as globalThis.ServiceWorker,
        register() {
          return Promise.resolve({ scope: 'https://example.com/' } as ServiceWorkerRegistration);
        },
      } as RegistrationContainer;

      const result = await withBrowser(
        { context: { href: 'https://example.com/' }, serviceWorker },
        () => ServiceWorker.register({ scriptUrl: '/sw.js' }),
      );

      expect(result.kind).to.eql('registered');
      if (result.kind === 'registered') expect(result.controller).to.eql('present');
    });

    it('throwing controller getter → reports unknown after verified registration', async () => {
      const serviceWorker = Object.defineProperties(
        {
          register() {
            return Promise.resolve({ scope: 'https://example.com/' } as ServiceWorkerRegistration);
          },
        },
        {
          controller: {
            get() {
              throw new Error('controller-observation');
            },
          },
        },
      ) as unknown as RegistrationContainer;

      const result = await withBrowser(
        { context: { href: 'https://example.com/' }, serviceWorker },
        () => ServiceWorker.register({ scriptUrl: '/sw.js' }),
      );

      expect(result.kind).to.eql('registered');
      if (result.kind === 'registered') expect(result.controller).to.eql('unknown');
    });
  });
});
