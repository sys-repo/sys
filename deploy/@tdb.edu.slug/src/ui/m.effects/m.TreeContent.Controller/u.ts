import { type t, D } from './common.ts';

type State = t.TreeContentController.State;
type Patch = t.TreeContentController.Patch;
type View = t.TreeContentController.View;

export function initialState(input: Patch = {}): State {
  return {
    phase: input.phase ?? D.initialState.phase,
    key: input.key,
    request: input.request,
    data: input.data,
    error: input.error,
  };
}

export function toView(state: State): View {
  return {
    phase: state.phase,
    loading: state.phase === 'loading',
    key: state.key,
    data: state.data,
    error: state.error,
  };
}
