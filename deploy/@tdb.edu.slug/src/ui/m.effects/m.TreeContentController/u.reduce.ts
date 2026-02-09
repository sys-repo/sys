import { type t } from './common.ts';
import {
  fromLoadCancel,
  fromLoadFail,
  fromLoadStart,
  fromLoadSucceed,
  fromSelectionChanged,
} from './u.from.ts';
import { initialState } from './u.ts';

export function reduceInput(
  current: t.TreeContentController.State,
  input: t.TreeContentController.Input,
): t.TreeContentController.Patch | undefined {
  switch (input.type) {
    case 'reset':
      return initialState();

    case 'selection.changed':
      return fromSelectionChanged(input.key);

    case 'load.start':
      return fromLoadStart(input.request);

    case 'load.cancel':
      return fromLoadCancel(current, input.requestId);

    case 'load.succeed':
      return fromLoadSucceed(current, input);

    case 'load.fail':
      return fromLoadFail(current, input);

    default:
      return undefined;
  }
}
