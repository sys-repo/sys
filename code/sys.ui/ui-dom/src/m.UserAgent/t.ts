import type { t } from './common.ts';

/**
 * Library for working with user-agent strings.
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent
 */
export type UserAgentLib = {
  /**
   * An object containing detailed information about the current user-agent.
   * Includes the reduced semantic data that the app consumes.
   */
  readonly current: t.UserAgent;
};

/**
 * Ref:
 *    https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent
 *
 *    Summary:
 *    "The User-Agent request header is a characteristic string that lets
 *     servers and network peers identify the application, operating system,
 *     vendor, and/or version of the requesting user agent."
 */
export type UserAgent = {
  readonly os: UserAgentOS;
  readonly is: UserAgentFlags;
};

/**
 * Flags (boolean) values derived from the user-agent string.
 */
export type UserAgentFlags = {
  readonly apple: boolean;
  readonly macOS: boolean;
  readonly iOS: boolean;
  readonly iPad: boolean;
  readonly iPhone: boolean;
  readonly chromium: boolean;
  readonly firefox: boolean;
};

/**
 * Details about the user-agent's operating system.
 */
export type UserAgentOS = {
  readonly name: string;
};
