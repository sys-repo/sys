import { type t, SlugClient, SlugSchema } from '../common.ts';
import { TreeHost } from '../ui.TreeHost/mod.ts';

type State = t.SlugPlaybackState;
type LoadBundleResult = t.SlugClientResult<t.TimecodePlaybackDriver.Wire.Bundle>;
type LoadBundle = (baseUrl: t.StringUrl, ref: t.StringId) => Promise<LoadBundleResult>;
type Props = { loadBundle?: LoadBundle };

/**
 * Attach the slug loader effect.
 *
 * Watches for selection changes. When the selected node
 * is a `refOnly` slug with a ref ID, loads the bundle from the endpoint.
 */
export function attachSlugLoaderEffect(controller: t.SlugPlaybackController, props: Props): void {
  const { loadBundle = SlugClient.FromEndpoint.Bundle.load } = props;
  const baseUrl = controller.props.baseUrl;
  let loadGen = 0; // Staleness tracking.
  const getSlug = () => controller.current().slug ?? {};
  const getPlayback = () => controller.current().playback ?? {};

  const run = (state: State) => {
    const slugState = state.slug;
    const playback = state.playback;
    const loading = slugState?.loading;
    const node = TreeHost.Data.findViewNode(slugState?.tree, slugState?.selectedPath);
    const value = node?.value;

    if (!SlugSchema.Tree.Is.refOnly(value)) {
      if (loading?.loadingRef || loading?.loadedRef || playback?.bundle) {
        controller.next({
          slug: { ...getSlug(), loading: undefined, error: undefined },
          playback: { ...getPlayback(), bundle: undefined },
        });
      }
      return;
    }

    const ref = value.ref;
    if (!ref) return;

    // Guard: do not retry the same ref while in-flight or once attempted.
    // Note: `loadedRef` is "last attempted ref" (success or failure) to prevent retry loops.
    if (loading?.loadingRef === ref || loading?.loadedRef === ref) return;

    // Start load.
    const gen = ++loadGen;
    const isStale = () => controller.disposed || gen !== loadGen;

    controller.next({
      slug: {
        ...getSlug(),
        loading: { isLoading: true, loadingRef: ref, loadedRef: undefined },
        error: undefined,
      },
      playback: { ...getPlayback(), bundle: undefined },
    });

    loadBundle(baseUrl, ref)
      .then((res) => {
        if (isStale()) return;

        if (!res.ok) {
          controller.next({
            slug: {
              ...getSlug(),
              loading: { isLoading: false, loadingRef: undefined, loadedRef: ref },
              error: { message: res.error.message },
            },
            playback: { ...getPlayback(), bundle: undefined },
          });
          return;
        }

        controller.next({
          slug: {
            ...getSlug(),
            loading: { isLoading: false, loadingRef: undefined, loadedRef: ref },
            error: undefined,
          },
          playback: { ...getPlayback(), bundle: res.value },
        });
      })
      .catch((e) => {
        if (isStale()) return;
        const message = e instanceof Error ? e.message : String(e);
        controller.next({
          slug: {
            ...getSlug(),
            loading: { isLoading: false, loadingRef: undefined, loadedRef: ref },
            error: { message },
          },
          playback: { ...getPlayback(), bundle: undefined },
        });
      });
  };

  // Subscribe and cleanup via lifecycle.
  const unsub = controller.onChange(run);
  controller.dispose$.subscribe(unsub);
}
