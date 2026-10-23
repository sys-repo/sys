import { Hash, Is, Pkg, Str, type t } from './common.ts';
import { ReferenceLink } from './ui.ReferenceLink.tsx';

const AUDIENCES = ['public', 'private'] as const;

/** Render observed sizes, content digests, and separate manifest-document checksums. */
export function Content({ bundleSize, manifests, manifestUrls }: t.Page.ContentProps) {
  return (
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
  );
}

/**
 * Helpers:
 */
function renderManifestRow(audience: t.Audience, manifest: t.Page.Manifest, href: string) {
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
