import { TreeHost } from '../../ui.TreeHost/mod.ts';
import { type t, SlugClient, SlugSchema } from '../common.ts';
import type { SlugEffectAdapter, SlugPlaybackSlugState } from './t.ts';

type LoadBundleResult = t.SlugClientResult<t.TimecodePlaybackDriver.Wire.Bundle>;
type LoadBundle = (baseUrl: t.StringUrl, ref: t.StringId) => Promise<LoadBundleResult>;
type Props = {
  readonly baseUrl: t.StringUrl;
  readonly loadBundle?: LoadBundle;
  readonly setBundle?: (bundle: t.TimecodePlaybackDriver.Wire.Bundle | undefined) => void;
};

/**
 * Attach the slug loader effect.
 *
 * Watches for selection changes. When the selected node
 * is a `refOnly` slug with a ref ID, loads the bundle from the endpoint.
 */
export function attachSlugLoaderEffect(adapter: SlugEffectAdapter, props: Props): void {
  const { baseUrl, loadBundle = SlugClient.FromEndpoint.Timeline.Bundle.load, setBundle } = props;
  const onBundle = setBundle ?? (() => {});
  let loadGen = 0; // Staleness tracking.
  const getSlug = () => adapter.current() ?? {};

  const run = (slugState?: SlugPlaybackSlugState) => {
    const loading = slugState?.loading;
    const node = TreeHost.Data.findViewNode(slugState?.tree, slugState?.selectedPath);
    const value = node?.value;

    if (!SlugSchema.Tree.Is.refOnly(value)) {
      if (loading?.loadingRef || loading?.loadedRef) {
        adapter.next({ ...getSlug(), loading: undefined, error: undefined });
      }
      onBundle(undefined);
      return;
    }

    const ref = value.ref;
    if (!ref) return;

    // Guard: do not retry the same ref while in-flight or once attempted.
    // Note: `loadedRef` is "last attempted ref" (success or failure) to prevent retry loops.
    if (loading?.loadingRef === ref || loading?.loadedRef === ref) return;

    // Start load.
    const gen = ++loadGen;
    const isStale = () => adapter.disposed || gen !== loadGen;

    adapter.next({
      ...getSlug(),
      loading: { isLoading: true, loadingRef: ref, loadedRef: undefined },
      error: undefined,
    });
    onBundle(undefined);

    loadBundle(baseUrl, ref)
      .then((res) => {
        if (isStale()) return;

        if (!res.ok) {
          adapter.next({
            ...getSlug(),
            loading: { isLoading: false, loadingRef: undefined, loadedRef: ref },
            error: { message: res.error.message },
          });
          onBundle(undefined);
          return;
        }

        adapter.next({
          ...getSlug(),
          loading: { isLoading: false, loadingRef: undefined, loadedRef: ref },
          error: undefined,
        });
        onBundle(res.value);
      })
      .catch((e) => {
        if (isStale()) return;
        const message = e instanceof Error ? e.message : String(e);
        adapter.next({
          ...getSlug(),
          loading: { isLoading: false, loadingRef: undefined, loadedRef: ref },
          error: { message },
        });
        onBundle(undefined);
      });
  };

  // Subscribe and cleanup via lifecycle.
  const unsub = adapter.onChange(run);
  adapter.dispose$.subscribe(unsub);
}
