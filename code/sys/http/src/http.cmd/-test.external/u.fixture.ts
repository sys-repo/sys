export const SCRATCH = './.tmp/httpcmd-browser-proof';
export const BUNDLE_NAME = 'page.js';

export const Echo = {
  name: 'fixture.echo',
  ns: 'fixture.http.cmd',
  path: '/cmd',
  text: 'browser echo',
  policy: { maxBytes: { request: 1024, response: 1024 }, timeout: 1_000 },
} as const;

export const Receipt = { path: '/observed', header: 'x-echo-receipt' } as const;

export type Name = typeof Echo.name;
export type Payload = { readonly [K in Name]: { readonly text: string } };
export type Result = { readonly [K in Name]: { readonly text: string; readonly receipt: string } };
