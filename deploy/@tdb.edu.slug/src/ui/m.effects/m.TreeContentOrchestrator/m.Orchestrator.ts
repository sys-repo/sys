import { type t, Is, slug } from './common.ts';

export const TreeContentOrchestrator: t.TreeContentOrchestrator.Lib = {
  create(props) {
    const makeRequestId = props.requestId ?? (() => `tree-content:${slug()}`);
    let disposed = false;

    const run = async (selection: t.TreeSelectionController.State) => {
      const key = selection.selectedRef;
      props.content.intent({ type: 'selection.changed', key });

      if (!Is.str(key) || key.length === 0) return;

      const request: t.TreeContentController.Request = { id: makeRequestId(), key };
      props.content.intent({ type: 'load.start', request });
      try {
        const data = await props.load({ request, selection });
        if (disposed) return;
        props.content.intent({ type: 'load.succeed', request, data });
      } catch (error) {
        if (disposed) return;
        const message = error instanceof Error ? error.message : String(error);
        props.content.intent({ type: 'load.fail', request, message });
      }
    };

    const stop = props.selection.onChange((selection) => {
      void run(selection);
    });
    void run(props.selection.current());

    return {
      get disposed() {
        return disposed;
      },
      dispose() {
        if (disposed) return;
        disposed = true;
        stop();
      },
    };
  },
};
