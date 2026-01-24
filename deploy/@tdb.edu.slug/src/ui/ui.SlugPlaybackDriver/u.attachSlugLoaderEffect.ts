import { type t, SlugClient, SlugSchema } from '../common.ts';
import { TreeHost } from '../ui.TreeHost/mod.ts';

type State = t.SlugPlaybackState;
type Controller = t.SlugPlaybackController;

type LoadBundle = (
  baseUrl: t.StringUrl,
  ref: string,
) => Promise<t.SlugClientResult<t.TimecodePlaybackDriver.Wire.Bundle>>;

type Deps = {
  readonly baseUrl: t.StringUrl;
  readonly loadBundle?: LoadBundle;
};

/**
 * Attach the slug loader effect.
 *
 * Watches for selection changes. When the selected node
 * is a `refOnly` with a ref, loads the bundle from the endpoint.
 */
export function attachSlugLoaderEffect(controller: Controller, deps: Deps): void {
  const { baseUrl, loadBundle = SlugClient.FromEndpoint.Bundle.load } = deps;
  let loadGen = 0; // Staleness tracking.

  const run = (state: State) => {
    const { tree, selectedPath, loadingRef, loadedRef, bundle } = state;
    const node = TreeHost.Data.findViewNode(tree, selectedPath);
    const value = node?.value;

    if (!SlugSchema.Tree.Is.refOnly(value)) {
      if (loadingRef || loadedRef || bundle) {
        controller.next({
          isLoading: false,
          error: undefined,
          bundle: undefined,
          loadingRef: undefined,
          loadedRef: undefined,
        });
      }
      return;
    }

    const ref = value.ref;
    if (!ref) return;
    if (loadingRef === ref || loadedRef === ref) return;

    // Start load.
    const gen = ++loadGen;
    const isStale = () => controller.disposed || gen !== loadGen;

    controller.next({
      isLoading: true,
      error: undefined,
      bundle: undefined,
      loadingRef: ref,
      loadedRef: undefined,
    });

    loadBundle(baseUrl, ref)
      .then((res) => {
        if (isStale()) return;

        if (!res.ok) {
          controller.next({
            isLoading: false,
            error: { message: res.error.message },
            bundle: undefined,
            loadingRef: undefined,
          });
          return;
        }

        controller.next({
          isLoading: false,
          bundle: res.value,
          loadingRef: undefined,
          loadedRef: ref,
        });
      })
      .catch((e) => {
        if (isStale()) return;
        const message = e instanceof Error ? e.message : String(e);
        controller.next({
          isLoading: false,
          bundle: undefined,
          loadingRef: undefined,
          error: { message },
        });
      });
  };

  // Subscribe and cleanup via lifecycle.
  const unsub = controller.onChange(run);
  controller.dispose$.subscribe(unsub);
}
