import { React, type t } from './common.ts';
import { startFetches } from '../u.load.ts';
import { Content } from './ui.Content.tsx';
import { ImageExamples } from './ui.ImageExamples.tsx';
import { Introduction } from './ui.Introduction.tsx';
import { ReferenceLink } from './ui.ReferenceLink.tsx';

const LOADING = 'Loading…';
const PENDING: t.Page.Manifest = { digest: LOADING, checksum: LOADING };

/**
 * Sample page container: own observation state and compose the complete React layout.
 */
export function Page(
  { origin = globalThis.location?.origin, publicAssetBase, managedImageUrl }: t.Page.Props,
) {
  const publicManifestUrl = new URL('dist.json', publicAssetBase).href;
  const manifestUrls: t.Page.ManifestUrls = {
    public: publicManifestUrl,
    private: '/ui/dist.json',
  };
  const [message, setMessage] = React.useState(LOADING);
  const [bundleSize, setBundleSize] = React.useState<number | string>(LOADING);
  const [manifests, setManifests] = React.useState<t.Page.Manifests>({
    public: PENDING,
    private: PENDING,
  });

  React.useEffect(() => {
    if (!origin) return;
    setMessage(LOADING);
    setBundleSize(LOADING);
    setManifests({ public: PENDING, private: PENDING });
    return startFetches({
      origin,
      publicManifestUrl,
      onMessage: setMessage,
      onManifest: (audience, manifest) =>
        setManifests((current) => ({ ...current, [audience]: manifest })),
      onBundleSize: (size) => setBundleSize(size ?? 'Could not load bundle size.'),
    });
  }, [origin, publicManifestUrl]);

  return (
    <>
      <main>
        <Introduction origin={origin} privateManifestUrl={manifestUrls.private} />
        <h2>Same-origin fetch</h2>
        <p aria-live='polite'>
          api.msg:{' '}
          <code>
            <ReferenceLink href='/api/hello'>"{message}"</ReferenceLink>
          </code>
        </p>
        <Content bundleSize={bundleSize} manifests={manifests} manifestUrls={manifestUrls} />
      </main>
      <ImageExamples publicAssetBase={publicAssetBase} managedImageUrl={managedImageUrl} />
    </>
  );
}
