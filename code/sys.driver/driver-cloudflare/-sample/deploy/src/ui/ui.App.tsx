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
        A workspace sample with Deno as the runtime and R2 as asset storage, exposed through one
        application origin (scheme, host, and port). The browser fetches{' '}
        <code>
          <a href='/api/hello'>/api/hello</a>
        </code>{' '}
        and{' '}
        <code>
          <a href='/ui/dist.json'>/ui/dist.json</a>
        </code>{' '}
        from that same origin, displaying the API message and the manifest’s{' '}
        <code>hash.digest</code>.
      </p>
      <p>
        Deno fetches each UI asset from R2 using a{' '}
        <a href='https://developers.cloudflare.com/r2/api/s3/presigned-urls/'>
          short-lived presigned URL
        </a>{' '}
        and serves its bytes to the browser, keeping both the URL and R2 credentials server-side.
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
