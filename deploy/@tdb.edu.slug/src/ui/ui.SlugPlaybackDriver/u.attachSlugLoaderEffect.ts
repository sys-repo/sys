import { type t, SlugClient, SlugSchema } from '../common.ts';
import { TreeHost } from '../ui.TreeHost/mod.ts';

type Controller = t.SlugPlaybackController;
type State = t.SlugPlaybackState;
type LoadBundle = (baseUrl: t.StringUrl, ref: string) => Promise<unknown>;

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
    const { tree, selectedPath, loadingRef, loadedRef } = state;
    const node = TreeHost.Data.findViewNode(tree, selectedPath);
    const value = node?.value;

    if (!SlugSchema.Tree.Is.refOnly(value)) {
      if (loadingRef || loadedRef) {
        controller.next({ loadingRef: undefined, loadedRef: undefined });
      }
      return;
    }
    const ref = value.ref;
    if (!ref) return;
    if (loadingRef === ref || loadedRef === ref) return;

    // Start load.
    const gen = ++loadGen;
    controller.next({ isLoading: true, error: undefined, loadingRef: ref });

    loadBundle(baseUrl, ref)
      .then((slug) => {
        if (controller.disposed || gen !== loadGen) return; // Stale.
        controller.next({ isLoading: false, slug, loadingRef: undefined, loadedRef: ref });
      })
      .catch((e) => {
        if (controller.disposed || gen !== loadGen) return; // Stale.
        const message = e instanceof Error ? e.message : String(e);
        controller.next({ isLoading: false, error: { message }, loadingRef: undefined });
      });
  };

  // Subscribe and cleanup via lifecycle.
  const unsub = controller.onChange(run);
  controller.dispose$.subscribe(unsub);
}
