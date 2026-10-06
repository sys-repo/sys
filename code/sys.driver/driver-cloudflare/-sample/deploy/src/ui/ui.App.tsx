import { Hash, Is, Pkg, React, Str, type t } from './common.ts';
import { startFetches } from './u.load.ts';

type Manifest = {
  readonly digest: string;
  readonly checksum: string;
  readonly size?: number;
};

const AUDIENCES = ['public', 'private'] as const;
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
  const manifestUrls: Readonly<Record<t.Audience, string>> = {
    public: publicManifestUrl,
    private: '/ui/dist.json',
  };
  const [message, setMessage] = React.useState('Loading…');
  const [bundleSize, setBundleSize] = React.useState<number | string>('Loading…');
  const [manifests, setManifests] = React.useState<Readonly<Record<t.Audience, Manifest>>>({
    public: PENDING,
    private: PENDING,
  });

  React.useEffect(() => {
    if (!origin) return;
    setMessage('Loading…');
    setBundleSize('Loading…');
    setManifests({ public: PENDING, private: PENDING });
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
      <h1>@sample</h1>
      <h2>Application server: HTML + API · Public R2: assets</h2>
      <p>
        A thin, Web Standards–based application server handles the HTML entry point and{' '}
        <ReferenceLink href='/api/hello'>/api</ReferenceLink> at the application origin
        {renderOrigin(origin)}. JavaScript, CSS, public images, and other public assets load
        directly from{' '}
        <ReferenceLink href='https://developers.cloudflare.com/r2/buckets/public-buckets/'>
          public R2
        </ReferenceLink>, avoiding application-server egress for those assets. Browsers verify
        HTML-linked scripts and styles using{' '}
        <ReferenceLink href='https://www.w3.org/TR/2016/REC-SRI-20160623/'>
          Subresource Integrity (SRI)
        </ReferenceLink>.
      </p>
      <p>
        The HTML entry point (<a href='/ui/index.html'>
          <code>index.html</code>
        </a>), its manifest (<ReferenceLink href={manifestUrls.private}>
          <code>dist.json</code>
        </ReferenceLink>), and the private image below are served from the application origin
        through a bounded relay to{' '}
        <ReferenceLink href='https://developers.cloudflare.com/r2/api/tokens/'>
          private R2
        </ReferenceLink>. The application server is the trust boundary for private R2 access. It
        fetches files using{' '}
        <ReferenceLink href='https://developers.cloudflare.com/r2/api/s3/presigned-urls/'>
          short-lived presigned GET URLs
        </ReferenceLink>; the browser receives bytes, not signed URLs or R2 credentials. This sample
        allows anonymous access to these files.
      </p>
      <h2>Same-origin fetch</h2>
      <p aria-live='polite'>
        api.msg:{' '}
        <code>
          <ReferenceLink href='/api/hello'>"{message}"</ReferenceLink>
        </code>
      </p>
      <section className='content-summary' aria-labelledby='content-heading'>
        <header>
          <h2 id='content-heading'>Content</h2>
          <code>scheme: sys.dist/v2</code>
        </header>
        <p className='build-total' aria-live='polite'>
          Build size · {Is.num(bundleSize) ? Str.bytes(bundleSize) : bundleSize}
        </p>
        <div
          className='manifest-table-scroll'
          role='region'
          aria-label='Distribution content'
          tabIndex={0}
        >
          <table className='identity-table' aria-labelledby='content-heading' aria-live='polite'>
            <thead>
              <tr>
                <th scope='col'>Distribution</th>
                <th scope='col' className='payload-size'>Payload</th>
                <th scope='col'>Content Digest (SHA-256)</th>
                <th scope='col'>Manifest</th>
              </tr>
            </thead>
            <tbody>
              {AUDIENCES.map((audience) => {
                return renderManifestRow(audience, manifests[audience], manifestUrls[audience]);
              })}
            </tbody>
          </table>
        </div>
        <p>
          Digests are abbreviated. These values are manifest reports, not payload verification. Open
          each manifest and compare its full <code>hash.scheme</code> and <code>hash.digest</code>
          {' '}
          with the corresponding pin in <code>dist.pins.json</code>.
        </p>
        <details className='manifest-checksums'>
          <summary>Manifest document checksums</summary>
          <p>
            SHA-256 of each fetched <code>dist.json</code> file
            <br />
            not the distribution’s content hash stored in <code>hash.digest</code>.
          </p>
          <dl aria-live='polite'>
            {AUDIENCES.map((audience) => {
              return (
                <div key={audience}>
                  <dt>
                    <ReferenceLink href={manifestUrls[audience]}>{audience}</ReferenceLink>
                  </dt>
                  <dd>
                    <code>{Str.stripPrefixOnce(manifests[audience].checksum, 'sha256-')}</code>
                  </dd>
                </div>
              );
            })}
          </dl>
        </details>
      </section>
    </main>
  );
}

/**
 * Helpers:
 */
/** Inspect supporting material beside the sample, regardless of its origin. */
function ReferenceLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target='_blank' rel='noopener noreferrer' title='Opens in a new tab'>
      {children} ↗
    </a>
  );
}

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

function renderManifestRow(audience: t.Audience, manifest: Manifest, href: string) {
  const digest = Pkg.Dist.Part.hash(manifest.digest);
  const elDigest = Is.str(digest)
    ? (
      <code title={`sys.dist/v2 ${manifest.digest}`}>
        {Hash.shorten(digest, [12, 5], { trimPrefix: true, divider: '…' })}
      </code>
    )
    : manifest.digest;

  return (
    <tr key={audience}>
      <th scope='row'>{audience}</th>
      <td className='payload-size'>{Is.num(manifest.size) ? Str.bytes(manifest.size) : '—'}</td>
      <td>{elDigest}</td>
      <td>
        <ReferenceLink href={href}>
          {audience === 'public' ? 'dist.json' : '/ui/dist.json'}
        </ReferenceLink>
      </td>
    </tr>
  );
}
