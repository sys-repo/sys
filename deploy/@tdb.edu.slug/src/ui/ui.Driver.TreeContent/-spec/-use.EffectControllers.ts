import { type t, useEffectController } from './common.ts';

export function useEffectControllers(debug: t.DebugSignals) {
  const o = debug.orchestrator;
  const selection = useEffectController(o.selection) ?? o.selection.current();
  const content = useEffectController(o.content) ?? o.content.current();
  return {
    selection,
    content,
  } as const;
}
