import { Is, type t } from './common.ts';
import { ReferenceLink } from './ui.ReferenceLink.tsx';

/** Explain the sample's delivery boundaries without performing IO. */
export function Introduction({ origin, privateManifestUrl }: t.Page.IntroductionProps) {
  return (
    <>
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
        </a>), its manifest (<ReferenceLink href={privateManifestUrl}>
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
    </>
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
