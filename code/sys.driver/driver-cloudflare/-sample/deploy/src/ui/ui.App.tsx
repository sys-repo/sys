import { Hash, Is, Pkg, pkg, React, Str } from './common.ts';
import { startFetches } from './u.load.ts';

type Manifest = {
  readonly digest: string;
  readonly checksum: string;
};

/**
 * Application Root
 */
export function App({ origin = globalThis.location?.origin }: { origin?: string } = {}) {
  const [message, setMessage] = React.useState('Loading…');
  const [bundleSize, setBundleSize] = React.useState<number>();
  const [manifest, setManifest] = React.useState<Manifest>({
    digest: 'Loading…',
    checksum: 'Loading…',
  });

  React.useEffect(() => {
    if (!origin) return;
    return startFetches(origin, setMessage, (digest, checksum) => {
      setManifest({ digest, checksum });
    }, setBundleSize);
  }, [origin]);

  return (
    <main>
      <h1>{pkg.name}</h1>
      <h2>Deno HTML and API · R2 assets</h2>
      <p>
        Deno serves this page and <a href='/api/hello'>/api</a> from the application origin
        {renderOrigin(origin)}. UI scripts, styles, and the image load directly from{' '}
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
      <h2>Manifest hashes</h2>
      {renderManifestTable(manifest, bundleSize)}
    </main>
  );
}

/**
 * Helpers:
 */
function renderOrigin(origin?: string) {
  if (!Is.str(origin) || origin === '') return null;
  return (
    <span>
      {' '}(<a href={origin}>{new URL(origin).host}</a>)
    </span>
  );
}

function renderManifestTable(manifest: Manifest, bundleSize: number | undefined) {
  const digest = Pkg.Dist.Part.hash(manifest.digest);
  const checksum = Pkg.Dist.Part.hash(manifest.checksum);
  const elDigest = Is.str(digest)
    ? (
      <a href='/ui/dist.json' title={manifest.digest}>
        {Hash.shorten(digest, [12, 5], { trimPrefix: true, divider: '…' })}
      </a>
    )
    : manifest.digest;
  const checksumLabel = Is.str(checksum)
    ? Hash.shorten(checksum, [12, 5], { trimPrefix: true, divider: '…' })
    : manifest.checksum;

  return (
    <table className='identity-table' aria-live='polite'>
      {renderManifestCaption(digest, bundleSize)}
      <thead>
        <tr>
          <th scope='col'>What</th>
          <th scope='col'>SHA-256</th>
          <th scope='col'>Compare in terminal</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope='row'>
            <a href='/ui/dist.json'>
              <code>dist.json → hash.digest</code>
            </a>
          </th>
          <td>
            <code>{elDigest}</code>
          </td>
          <td>
            <code>deno task serve</code> → <code>shell</code>
          </td>
        </tr>
        <tr>
          <th scope='row'>
            Checksum of <code>dist.json</code>
          </th>
          <td>
            <code title={manifest.checksum}>{checksumLabel}</code>
          </td>
          <td>
            <code>deno task build</code> → <code>private:</code>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function renderManifestCaption(digest: string | undefined, bundleSize: number | undefined) {
  const elDigest = Is.str(digest)
    ? <code>#{Hash.shorten(digest, [0, 5], { trimPrefix: true })}</code>
    : null;
  const elSize = Is.num(bundleSize)
    ? <span title='Total bundle size'>{Str.bytes(bundleSize)}</span>
    : null;

  return (
    <caption>
      Private relay — <a href='/ui/dist.json'>/ui/dist.json</a>
      {elDigest && ' • '}
      {elDigest}
      {elSize && ' • '}
      {elSize}
    </caption>
  );
}
