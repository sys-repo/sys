import { Hash, Is, Pkg, pkg, React } from './common.ts';
import { startFetches } from './u.load.ts';

/**
 * Application Root
 */
export function App({ origin = globalThis.location?.origin }: { origin?: string } = {}) {
  const [message, setMessage] = React.useState('Loading…');
  const [manifest, setManifest] = React.useState({ digest: 'Loading…', checksum: 'Loading…' });
  const digest = Pkg.Dist.Part.hash(manifest.digest);
  const checksum = Pkg.Dist.Part.hash(manifest.checksum);

  React.useEffect(() => {
    if (!origin) return;
    return startFetches(origin, setMessage, (digest, checksum) => {
      setManifest({ digest, checksum });
    });
  }, [origin]);

  return (
    <main>
      <h1>{pkg.name}</h1>
      <h2>Deno HTML and API · R2 assets</h2>
      <p>
        Deno serves this page and <a href='/api/hello'>/api</a> from the application origin
        {origin && (
          <>
            {' '}(<a href={origin}>{new URL(origin).host}</a>)
          </>
        )}. UI scripts and styles load directly from{' '}
        <a href='https://developers.cloudflare.com/r2/buckets/public-buckets/'>public R2</a>,
        avoiding Deno egress for those assets.
      </p>
      <p>
        <code>index.html</code> and <code>dist.json</code> are stored in{' '}
        <a href='https://developers.cloudflare.com/r2/api/tokens/'>private R2</a>{' '}
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
      <h2>Compare build and serve</h2>
      <table className='identity-table' aria-live='polite'>
        <caption>
          Private relay — <a href='/ui/dist.json'>/ui/dist.json</a>
          {Is.str(digest) && (
            <>
              {' • '}
              <code>#{Hash.shorten(digest, [0, 5], { trimPrefix: true })}</code>
            </>
          )}
        </caption>
        <thead>
          <tr>
            <th scope='col'>What</th>
            <th scope='col'>SHA-256</th>
            <th scope='col'>Find in terminal</th>
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
              <code>
                {Is.str(digest)
                  ? (
                    <a href='/ui/dist.json' title={manifest.digest}>
                      {Hash.shorten(digest, [12, 5], { trimPrefix: true, divider: '…' })}
                    </a>
                  )
                  : manifest.digest}
              </code>
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
              <code title={manifest.checksum}>
                {Is.str(checksum)
                  ? Hash.shorten(checksum, [12, 5], { trimPrefix: true, divider: '…' })
                  : manifest.checksum}
              </code>
            </td>
            <td>
              <code>deno task build</code> → <code>private:</code>
            </td>
          </tr>
        </tbody>
      </table>
    </main>
  );
}
