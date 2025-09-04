import { type t, HttpClient as Client, HttpPull as Pull, HttpServer as Server } from './common.ts';

export const Http: t.HttpLib = {
  Client,
  client: Client.fetcher,
  Server,
  Pull,
};
