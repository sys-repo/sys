import type { t } from './common.ts';

/**
 * Dev-harness URL interpretation types.
 */
export type DevUrlConfig = {
  readonly showDebug: boolean | null;
};

/**
 * Parse a dev URL into a typed configuration object.
 */
export type ReadDevUrl = (input: t.StringUrl | URL) => DevUrlConfig;

/**
 * Produce a new URL instance from the given one,
 * applying configuration cues from a DevUrlConfig object.
 */
export type ChangeDevUrl = (input: t.StringUrl | URL, value: Partial<DevUrlConfig>) => URL;

/**
 * Value type for dev URL toggles.
 * `null` means "not specified" (param removed).
 */
export type DevToggle = boolean | null;

/**
 * Proxy instance returned by `DevUrl.make`.
 * Exposes declarative getters/setters that read/write the address bar.
 */
export type DevUrlProxy = {
  get debug(): DevToggle;
  set debug(v: DevToggle);
};

/**
 * Factory for a proxy bound to a specific window.
 */
export type DevUrlMake = (win: Window) => DevUrlProxy;

/**
 * Public DevUrl library surface.
 */
export type DevUrlLib = {
  readonly make: DevUrlMake;
  readonly read: ReadDevUrl;
  readonly change: ChangeDevUrl;
};
