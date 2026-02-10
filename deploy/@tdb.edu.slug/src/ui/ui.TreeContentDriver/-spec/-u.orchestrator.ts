import { TreeContentDriver } from '../mod.ts';
import { type t, Is, Signal } from './common.ts';
import { resolveLoader, treeFromResponse } from './-u.loaders.ts';

type DataCardSignals = t.DataCardSignals;
type PropsSignals = {
  readonly origin: t.Signal<t.SlugUrlOrigin | undefined>;
  readonly cardKind: t.Signal<t.DataCardKind | undefined>;
};

export type SpecOrchestrator = t.TreeContentDriver.Orchestrator;

export function createOrchestrator(args: {
  props: PropsSignals;
  card: DataCardSignals;
}): SpecOrchestrator {
  const card = args.card.props;
  let lastResponse: unknown = undefined;
  let lastCardRef: string | undefined = card.treeContent.ref.value;

  const orchestrator = TreeContentDriver.createOrchestrator({
    load: (input) =>
      resolveLoader({
        kind: args.props.cardKind.value ?? 'file-content',
        origin: args.props.origin.value,
      })(input),
    onSelectedRefChange(ref) {
      if (card.treeContent.ref.value === ref) return;
      card.treeContent.ref.value = ref;
      lastCardRef = ref;
    },
  });

  Signal.effect(() => {
    if (orchestrator.disposed) return;
    const response = card.result.response.value;
    if (response === lastResponse) return;
    lastResponse = response;
    const tree = treeFromResponse(response);
    if (!tree) return;
    orchestrator.intent({ type: 'tree.set', tree });
    orchestrator.intent({ type: 'path.request', path: undefined });
    card.treeContent.ref.value = undefined;
    lastCardRef = undefined;
  });

  Signal.effect(() => {
    if (orchestrator.disposed) return;
    if (args.props.cardKind.value !== 'file-content') return;
    if (card.spinning.value) return;
    const ref = card.treeContent.ref.value;
    if (ref === lastCardRef) return;
    lastCardRef = ref;
    if (Is.str(ref) && ref.length > 0) {
      orchestrator.intent({ type: 'ref.request', ref });
    } else {
      orchestrator.intent({ type: 'path.request', path: undefined });
    }
  });

  return orchestrator;
}
