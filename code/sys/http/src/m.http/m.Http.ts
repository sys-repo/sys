import { type t, HttpClient as Client, HttpClient, HttpServer as Server } from './common.ts';

export const Http: t.HttpLib = {
  Server,
  Client,
  client: HttpClient.fetcher,
};
