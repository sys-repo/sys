import { type t, Is, Rx, slug } from './common.ts';

export const create: t.TreeContentOrchestrator.Lib['create'] = (props) => {
  const life = Rx.lifecycle(props.until);
  const makeRequestId = props.requestId ?? (() => `tree-content:${slug()}`);

  const run = async (selection: t.TreeSelectionController.State) => {
    const key = selection.selectedRef;
    props.content.intent({ type: 'selection.changed', key });

    if (!Is.str(key) || key.length === 0) return;

    const request: t.TreeContentController.Request = { id: makeRequestId(), key };
    props.content.intent({ type: 'load.start', request });
    try {
      const data = await props.load({ request, selection });
      if (life.disposed) return;
      props.content.intent({ type: 'load.succeed', request, data });
    } catch (error) {
      if (life.disposed) return;
      const message = error instanceof Error ? error.message : String(error);
      props.content.intent({ type: 'load.fail', request, message });
    }
  };

  const stop = props.selection.onChange((selection) => void run(selection));
  life.dispose$.subscribe(stop);
  void run(props.selection.current());

  return life;
};
