import { createRoot, Hash, Is, Pkg, pkg, React } from './common.ts';
import { startFetches } from './u.load.ts';

/**
 * Application Root
 */
export function App() {
  const [message, setMessage] = React.useState('Loading…');
  const [digest, setDigest] = React.useState('Loading…');
  const hash = Pkg.Dist.Part.hash(digest);
  // Keep the sha256- prefix and eight hex digits at each end.
  const digestLabel = Is.str(hash) ? Hash.shorten(hash, [15, 8], { divider: '…' }) : digest;
  React.useEffect(() => startFetches(window.location.origin, setMessage, setDigest), []);
  return (
    <main>
      <h1>{pkg.name}</h1>
      <h2>Runtime: Deno · Asset storage: R2</h2>
      <p>
        This <code>@sys/driver-cloudflare/r2</code>{' '}
        sample demonstrates how Deno serves an API and UI from one application origin. UI assets are
        stored in a{' '}
        <a href='https://developers.cloudflare.com/r2/buckets/public-buckets/'>
          private R2 bucket
        </a>.
      </p>
      <p>
        The browser fetches{' '}
        <code>
          <a href='/api/hello'>/api/hello</a>
        </code>{' '}
        and{' '}
        <code>
          <a href='/ui/dist.json'>/ui/dist.json</a>
        </code>{' '}
        from the same origin.
      </p>
      <p>
        Deno fetches each UI asset from R2 using a{' '}
        <a href='https://developers.cloudflare.com/r2/api/s3/presigned-urls/'>
          short-lived presigned URL
        </a>{' '}
        and returns the bytes to the browser. The presigned URL and R2 credentials stay server-side.
      </p>
      <h2>Same-origin fetches</h2>
      <ul className='fetches' aria-live='polite'>
        <li>
          message:{' '}
          <code>
            "<a href='/api/hello'>{message}</a>"
          </code>
        </li>
        <li>
          digest:{' '}
          <code className='digest'>
            "<a href='/ui/dist.json' title={digest} aria-label={digest}>{digestLabel}</a>"
          </code>
        </li>
      </ul>
      <p>
        <strong>Note:</strong>{' '}
        Displaying the manifest’s digest does not verify the downloaded assets.
      </p>
    </main>
  );
}
