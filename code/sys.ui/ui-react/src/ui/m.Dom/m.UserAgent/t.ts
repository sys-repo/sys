import type { t } from '../common.ts';

/**
 * A string representing a user-agent.
 */
export type UserAgentString = string;

/**
 * Library for working with user-agent strings.
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent
 */
export type UserAgentLib = {
  /**
   * An object containing information about operating system kinds.
   */
  readonly os: {
    /**
     * Enumeration representing the supported operating systems.
     * Possible values include 'Windows', 'macOS', 'Linux', 'Android', 'iOS', etc.
     */
    kinds: t.UserAgentOSKind[];
  };

  /**
   * An array of user-agent flags.
   * These flags represent specific characteristics or capabilities of the user-agent,
   * such as 'Mobile', 'Tablet', 'Desktop', 'Bot', etc.
   */
  readonly flags: t.UserAgentFlag[];

  /**
   * An object containing detailed information about the current user-agent.
   * Includes parsed details like browser name and version, operating system and version,
   * device type, engine (e.g., WebKit, Gecko, Blink), and additional flags or features.
   */
  readonly current: t.UserAgent;

  /**
   * Convert a browser user-agent string into a structured object.
   * Example:
   *
   *    const ua = UserAgent.parse(navigator.userAgent);
   */
  parse(input: t.UserAgentString): t.UserAgent;
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
  readonly browser: UserAgentBrowser;
  readonly engine: UserAgentEngine;
  readonly os: UserAgentOS;
  readonly device: UserAgentDevice;
  readonly is: UserAgentFlags;
};

/**
 * The kind of operating-system the user-agent is from.
 */
export type UserAgentOSKind = 'macOS' | 'iOS' | 'windows' | 'posix' | 'android' | 'UNKNOWN';

/**
 * A single user-agent flag.
 */
export type UserAgentFlag = keyof UserAgentFlags;

/**
 * Flags (boolean) values derived from the user-agent string.
 */
export type UserAgentFlags = {
  macOS: boolean;
  iOS: boolean;
  iPad: boolean;
  iPhone: boolean;
  posix: boolean;
  android: boolean;
  windows: boolean;
  mobile: boolean;
  tablet: boolean;
};

/**
 * The browser the user-agent string represents.
 */
export type UserAgentBrowser = {
  readonly name: string;
  readonly version: string;
  readonly major: string;
};

/**
 * Details about the user-agent's rendering engine.
 */
export type UserAgentEngine = {
  readonly name: string;
  readonly version: string;
};

/**
 * Details about the user-agent's operating system.
 */
export type UserAgentOS = {
  readonly kind: UserAgentOSKind;
  readonly name: string;
  readonly version: string;
};

/**
 * Details about the device the user-agent is running on.
 */
export type UserAgentDevice = {
  readonly vendor: string;
  readonly model: string;
  readonly type: string;
};
