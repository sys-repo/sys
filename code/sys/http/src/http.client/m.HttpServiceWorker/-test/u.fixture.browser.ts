import { WebFixture } from '../../../-test.ts';

export type RegistrationContainer = Pick<ServiceWorkerContainer, 'controller' | 'register'>;

type LocationFixture =
  | { context?: unknown; locationGetter?: never }
  | { context?: never; locationGetter: () => unknown };

type RegistrationFixture =
  | { serviceWorker?: unknown; serviceWorkerGetter?: never }
  | { serviceWorker?: never; serviceWorkerGetter: () => unknown };

type BrowserFixture = LocationFixture & RegistrationFixture;

/**
 * Run against one isolated snapshot of browser location and registration authority.
 * Do not overlap this process-global fixture across parallel tests.
 */
export async function withBrowser<T>(fixture: BrowserFixture, run: () => Promise<T>): Promise<T> {
  const properties = WebFixture.Property.mock([
    {
      target: globalThis,
      key: 'location',
      descriptor: fixture.locationGetter
        ? { configurable: true, get: fixture.locationGetter }
        : { configurable: true, value: fixture.context },
    },
    {
      target: globalThis.navigator,
      key: 'serviceWorker',
      descriptor: fixture.serviceWorkerGetter
        ? { configurable: true, get: fixture.serviceWorkerGetter }
        : { configurable: true, value: fixture.serviceWorker },
    },
  ]);

  try {
    return await run();
  } finally {
    properties.dispose();
  }
}
