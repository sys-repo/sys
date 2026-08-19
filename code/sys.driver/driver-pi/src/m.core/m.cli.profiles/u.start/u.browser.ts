import type { t } from './common.ts';

/** Fixed browser authority for one verified Driver Pi Dist on numeric loopback. */
export const VERIFIED_LOOPBACK_BROWSER_POLICY = Object.freeze({
  kind: 'verified-loopback',
  dedicatedWorkers: Object.freeze([]),
  serviceWorker: Object.freeze({ kind: 'tombstone', path: 'sw.js' }),
}) satisfies t.DistServer.BrowserPolicy.Input;
