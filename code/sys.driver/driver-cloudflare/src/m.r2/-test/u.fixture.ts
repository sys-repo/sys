import type { t } from '../../-test.ts';

export const accountId = '0123456789abcdef0123456789abcdef';

export const credentials = {
  accessKeyId: 'access-key',
  secretAccessKey: 'secret-key',
} as const;

export function fakeTransport(calls: unknown[] = []): t.R2.Bucket.TransportFactory {
  return () => ({
    stat(key) {
      calls.push(['stat', key]);
      return Promise.resolve({ key, size: 5, etag: 'stat-etag' });
    },
    read(key) {
      calls.push(['read', key]);
      return Promise.resolve(new Response('hello'));
    },
    write(key, data, options) {
      calls.push(['write', key, data, options]);
      return Promise.resolve({ etag: 'write-etag' });
    },
    remove(key) {
      calls.push(['remove', key]);
      return Promise.resolve();
    },
    async *list(options) {
      calls.push(['list', options]);
      yield { key: 'assets/app.js', size: 12 };
    },
  });
}
