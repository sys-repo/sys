import {
  TreeContentController,
  TreeContentOrchestrator,
  TreeSelectionController,
} from '../m.effects/mod.ts';
import { type t, Rx } from './common.ts';

export const createOrchestrator: t.TreeContentDriver.Lib['createOrchestrator'] = (props) => {
  const life = Rx.lifecycle(props.until);
  const selection = props.selection ?? TreeSelectionController.create();
  const content = props.content ?? TreeContentController.create();
  const orchestrator = TreeContentOrchestrator.create({
    until: life,
    selection,
    content,
    load: props.load,
  });

  const stopSelection = selection.onChange((state) => props.onSelectedRefChange?.(state.selectedRef));
  life.dispose$.subscribe(stopSelection);
  life.dispose$.subscribe(() => orchestrator.dispose());

  const api = Rx.toLifecycle<t.TreeContentDriver.Orchestrator>(life, {
    selection,
    content,
    intent(next) {
      switch (next.type) {
        case 'tree.set':
          selection.intent({ type: 'tree.set', tree: next.tree });
          return;
        case 'tree.clear':
          selection.intent({ type: 'tree.clear' });
          return;
        case 'path.request':
          selection.intent({ type: 'path.request', path: next.path });
          return;
        case 'ref.request':
          selection.intent({ type: 'ref.request', ref: next.ref });
          return;
        case 'reset':
          api.reset();
          return;
      }
    },
    reset() {
      selection.intent({ type: 'tree.clear' });
      selection.intent({ type: 'reset' });
      content.intent({ type: 'reset' });
    },
  });

  return api;
};
