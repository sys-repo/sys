import { TreeContentDriver } from '../mod.ts';
import { TreeSelectionCardOrchestrator } from '../../m.effects/mod.ts';
import { type t } from './common.ts';
import { resolveLoader, treeFromResponse } from './-u.data-card.loaders.ts';

type DataCardSignals = t.DataCardSignals;
type PropsSignals = {
  readonly origin: t.Signal<t.SlugUrlOrigin | undefined>;
  readonly cardKind: t.Signal<t.DataCardKind | undefined>;
};

export type SpecOrchestrator = t.TreeContentDriver.Orchestrator;

export function createCardOrchestrator(args: {
  props: PropsSignals;
  card: DataCardSignals;
}): SpecOrchestrator {
  const orchestrator = TreeContentDriver.orchestrator({
    load(input) {
      return resolveLoader({
        kind: args.props.cardKind.value ?? 'file-content',
        origin: args.props.origin.value,
      })(input);
    },
  });
  TreeSelectionCardOrchestrator.create({
    until: orchestrator,
    selection: orchestrator.selection,
    cardKind: args.props.cardKind,
    card: args.card.props,
    tree: {
      fromResponse: treeFromResponse,
    },
  });

  return orchestrator;
}
