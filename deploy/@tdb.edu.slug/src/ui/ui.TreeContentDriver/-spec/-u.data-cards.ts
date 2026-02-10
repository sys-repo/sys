import { DataCards } from '../../-dev/ui.Http.DataCards/mod.ts';
import { type t, Signal } from './common.ts';

export function createDataCards(debug: t.DebugSignals) {
  const { card, orchestrator } = debug;
  const v = Signal.toObject(debug.props);
  return DataCards.createPanel({
    signals: debug.card,
    origin: v.origin,
    env: v.env,
    theme: v.theme,
    debug: v.debug,
    kind: v.cardKind,
    kinds: ['file-content', 'playback-content'],
    onKindSelect(kind) {
      if (v.cardKind === kind) return;
      v.cardKind = kind;
      orchestrator.reset();
      card.reset();
      card.props.treeContent.ref.value = undefined;
      card.props.treeContent.refs.value = undefined;
      card.props.treePlayback.ref.value = undefined;
      card.props.treePlayback.refs.value = undefined;
    },
  });
}
