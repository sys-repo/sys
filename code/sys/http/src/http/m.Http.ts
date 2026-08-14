import { HttpClient as Client, HttpServer as Server, type t } from './common.ts';

/**
 * Universal (client + server) HTTP namespace.
 */
export const Http: t.Http.Lib = Object.freeze({
  Client,
  client: Client.fetcher,
  Server,
});
