/**
 * @module
 * Library for working with user-agent strings.
 *
 * Ref:
 *    https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent
 *
 *    Summary:
 *    "The User-Agent request header is a characteristic string that lets
 *     servers and network peers identify the application, operating system,
 *     vendor, and/or version of the requesting user agent.""
 *
 * @example
 * ```ts
 * import { UserAgent } from '@sys/ui-dom/user-agent';
 * console.log(UserAgent.current);
 * ```
 */
export * from './m.UserAgent.ts';
