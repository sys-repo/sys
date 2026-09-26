import { Hash, Is, Pkg, pkg, React, Str, type t } from './common.ts';
import { startFetches } from './u.load.ts';

type Manifest = {
  readonly digest: string;
  readonly checksum: string;
  readonly size?: number;
};

const PENDING: Manifest = { digest: 'Loading…', checksum: 'Loading…' };

/**
 * Application Root
 */
export function App(
  { origin = globalThis.location?.origin, publicAssetBase }: {
    origin?: string;
    publicAssetBase: string;
  },
) {
  const publicManifestUrl = new URL('dist.json', publicAssetBase).href;
  const [message, setMessage] = React.useState('Loading…');
  const [bundleSize, setBundleSize] = React.useState<number | string>('Loading…');
  const [manifests, setManifests] = React.useState<Readonly<Record<t.Audience, Manifest>>>({
    private: PENDING,
    public: PENDING,
  });

  React.useEffect(() => {
    if (!origin) return;
    setMessage('Loading…');
    setBundleSize('Loading…');
    setManifests({ private: PENDING, public: PENDING });
    return startFetches(
      origin,
      publicManifestUrl,
      setMessage,
      (audience, digest, checksum, size) => {
        setManifests((current) => ({ ...current, [audience]: { digest, checksum, size } }));
      },
      (size) => setBundleSize(size ?? 'Could not load bundle size.'),
    );
  }, [origin, publicManifestUrl]);

  return (
    <main>
      <h1>{pkg.name}</h1>
      <h2>Deno HTML and API · R2 assets</h2>
      <p>
        Deno serves this page and <a href='/api/hello'>/api</a> from the application origin
        {renderOrigin(origin)}. UI scripts, styles, and images load directly from{' '}
        <a href='https://developers.cloudflare.com/r2/buckets/public-buckets/'>public R2</a>,
        avoiding Deno egress for those assets.
      </p>
      <p>
        <code>
          <a href='/ui/index.html'>index.html</a>
        </code>{' '}
        and{' '}
        <code>
          <a href='/ui/dist.json'>dist.json</a>
        </code>{' '}
        are stored in <a href='https://developers.cloudflare.com/r2/api/tokens/'>private R2</a>{' '}
        and served through a bounded relay. Deno fetches them with{' '}
        <a href='https://developers.cloudflare.com/r2/api/s3/presigned-urls/'>
          short-lived presigned GET URLs
        </a>; the browser receives bytes, not signed URLs or R2 credentials.
      </p>
      <h2>Same-origin fetches</h2>
      <p aria-live='polite'>
        api.msg:{' '}
        <code>
          "<a href='/api/hello'>{message}</a>"
        </code>
      </p>
      <h2>Manifest</h2>
      <p className='bundle-size' aria-live='polite'>
        total bundle • {Is.num(bundleSize) ? Str.bytes(bundleSize) : bundleSize}
      </p>
      {renderManifestTable('private', manifests.private, '/ui/dist.json')}
      {renderManifestTable('public', manifests.public, publicManifestUrl)}
    </main>
  );
}

/**
 * Helpers:
 */
function renderOrigin(origin?: string) {
  if (!Is.str(origin) || origin === '') return null;
  return (
    <>
      {' '}
      <span>
        (<a href={origin}>{new URL(origin).host}</a>)
      </span>
    </>
  );
}

function renderManifestTable(audience: t.Audience, manifest: Manifest, href: string) {
  const isPrivate = audience === 'private';
  const digest = Pkg.Dist.Part.hash(manifest.digest);
  const checksum = Pkg.Dist.Part.hash(manifest.checksum);
  const elDigest = Is.str(digest)
    ? (
      <a href={href} title={manifest.digest}>
        {Hash.shorten(digest, [12, 5], { trimPrefix: true, divider: '…' })}
      </a>
    )
    : manifest.digest;
  const checksumLabel = Is.str(checksum)
    ? Hash.shorten(checksum, [12, 5], { trimPrefix: true, divider: '…' })
    : manifest.checksum;

  return (
    <div
      className='manifest-table-scroll'
      role='region'
      aria-label={`${audience} manifest hashes`}
      tabIndex={0}
    >
      <table className='identity-table' aria-live='polite'>
        <caption>
          {isPrivate ? 'private relay' : 'public R2'} —{' '}
          <a href={href}>{isPrivate ? '/ui/dist.json' : 'dist.json ↗'}</a>
          {Is.str(digest) && (
            <>
              {' • '}
              <code>#{Hash.shorten(digest, [0, 5], { trimPrefix: true })}</code>
            </>
          )}
          {Is.num(manifest.size) && (
            <>
              {' • '}
              <span title='Distribution payload size'>{Str.bytes(manifest.size)}</span>
            </>
          )}
        </caption>
        <thead>
          <tr>
            <th scope='col'>What</th>
            <th scope='col'>SHA-256</th>
            <th scope='col'>Compare locally</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope='row'>
              <a href={href}>
                <code>dist.json → hash.digest</code>
              </a>
            </th>
            <td>
              <code>{elDigest}</code>
            </td>
            <td>
              {isPrivate
                ? (
                  <>
                    <code>deno task serve</code> → <code>shell</code>
                  </>
                )
                : <code>dist.public/dist.json</code>}
            </td>
          </tr>
          <tr>
            <th scope='row'>
              checksum of <code>dist.json</code>
            </th>
            <td>
              <code title={manifest.checksum}>{checksumLabel}</code>
            </td>
            <td>
              <code>deno task build</code> → <code>{audience}:</code>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
