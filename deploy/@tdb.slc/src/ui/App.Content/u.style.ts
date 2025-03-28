import { type t } from './common.ts';

export function showBackgroundColor(state?: t.AppSignals) {
  if (!state) return false;
  return state.props.content.value?.solidBackground?.(state) ?? false;
}
