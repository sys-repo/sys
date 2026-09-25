import { CompositeHash, Hash } from '@sys/crypto/hash';
import { Ignore } from '@sys/std/ignore';
import type { t } from '../../-test.ts';
import { origin } from './u.fixture.readRoute.ts';

const ignoreDigest = await Ignore.digest([]);

/** A real checksummed manifest, with no filesystem or provider dependencies. */
export function fixture() {
  const parts = { 'index.html': `${Hash.sha256('hello')}:size=5` };
  const dist: t.DeepMutable<t.DistPkg> = {
    type: 'https://example.com/dist',
    build: {
      time: 1,
      size: { total: 5, pkg: 0 },
      builder: '@test/builder@1.0.0',
      runtime: 'test',
      hash: {
        policy: 'https://example.com/hash',
        ignore: { format: 'gitignore', rules: [], 'rules:digest': ignoreDigest },
      },
    },
    hash: { digest: CompositeHash.digest(parts), parts },
  };
  const bytes = new TextEncoder().encode(JSON.stringify(dist));
  const signed: string[] = [];
  const authorized: string[] = [];
  const policies: t.DeepReadonly<t.DistPkg>[] = [];
  const args: t.R2.ReadRoute.FromDist.Args = {
    bucket: {
      name: 'assets',
      presignGet(key) {
        signed.push(key);
        return Promise.resolve(
          `${origin}/assets/${key.split('/').map(encodeURIComponent).join('/')}`,
        );
      },
    },
    storageOrigin: origin,
    prefix: 'release',
    pin: { 'dist.json': Hash.sha256(bytes) },
    manifestLimits: { manifestBytes: bytes.length, entries: 2, fileBytes: 5, totalBytes: 5 },
    limits: { maxBytes: 8, timeout: 1000, maxConcurrent: 1 },
    routes(dist) {
      policies.push(dist);
      return { '/': 'index.html', '/index.html': 'index.html', '/dist.json': 'dist.json' };
    },
    authorize({ key }) {
      authorized.push(key);
      return true;
    },
  };
  return { args, bytes, dist, signed, authorized, policies };
}
