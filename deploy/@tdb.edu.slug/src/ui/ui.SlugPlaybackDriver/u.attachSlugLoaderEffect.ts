import { type t, SlugClient, SlugSchema } from '../common.ts';
import { TreeHost } from '../ui.TreeHost/mod.ts';

type Controller = t.SlugPlaybackController;
type State = t.SlugPlaybackState;

type Deps = {
  baseUrl: t.StringUrl;
};

export function attachSlugLoaderEffect(controller: Controller, deps: Deps): void {
  const { baseUrl } = deps;
  let loadGen = 0; // Staleness tracking.

  const run = (state: State) => {
    const { tree, selectedPath } = state;
    const node = TreeHost.Data.findViewNode(tree, selectedPath);
    const value = node?.value;

    if (!SlugSchema.Tree.Is.refOnly(value)) return;
    const ref = value.ref;
    if (!ref) return;

    // Start load.
    const gen = ++loadGen;
    controller.next({ isLoading: true, error: undefined });

    SlugClient.FromEndpoint.Bundle.load(baseUrl, ref)
      .then((slug) => {
        if (controller.disposed || gen !== loadGen) return; // Stale.
        controller.next({ isLoading: false, slug });
      })
      .catch((e) => {
        if (controller.disposed || gen !== loadGen) return; // Stale.
        const message = e instanceof Error ? e.message : String(e);
        controller.next({ isLoading: false, error: { message } });
      });
  };

  // Subscribe and cleanup via lifecycle.
  const unsub = controller.onChange(run);
  controller.dispose$.subscribe(unsub);
}
