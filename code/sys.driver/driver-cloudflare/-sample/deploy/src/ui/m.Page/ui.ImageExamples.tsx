import type { t } from './common.ts';
import { ReferenceLink } from './ui.ReferenceLink.tsx';

/** Same artwork, explicit filename roles, and three browser request destinations. */
export function ImageExamples({ publicAssetBase, managedImageUrl }: t.Page.ImageExamplesProps) {
  const publicImageUrl = new URL('images/wax-seal.png', publicAssetBase).href;
  const privateImageUrl = '/ui/images/wax-seal.png';

  return (
    <footer className='image-comparison'>
      <div className='image-examples'>
        <figure className='image-example'>
          <img src={managedImageUrl} width={64} height={64} alt='Red wax seal' />
          <figcaption>
            <strong>Vite-managed asset</strong>
            <span>Fingerprinted filename</span>
            <ReferenceLink href='https://developers.cloudflare.com/r2/buckets/public-buckets/'>
              Public R2
            </ReferenceLink>
            <code>pkg/a.[hash].png</code>
          </figcaption>
        </figure>
        <figure className='image-example'>
          <img src={publicImageUrl} width={64} height={64} alt='Red wax seal' />
          <figcaption>
            <strong>Public file</strong>
            <span>Preserved filename</span>
            <ReferenceLink href='https://developers.cloudflare.com/r2/buckets/public-buckets/'>
              Public R2
            </ReferenceLink>
            <code>images/wax-seal.png</code>
          </figcaption>
        </figure>
        <figure className='image-example'>
          <img src={privateImageUrl} width={64} height={64} alt='Red wax seal' />
          <figcaption>
            <strong>Private file</strong>
            <span>Preserved filename</span>
            <ReferenceLink href='https://developers.cloudflare.com/r2/api/tokens/'>
              Private R2
            </ReferenceLink>
            <code>
              <ReferenceLink href={privateImageUrl}>images/wax-seal.png</ReferenceLink>
            </code>
          </figcaption>
        </figure>
      </div>
    </footer>
  );
}
