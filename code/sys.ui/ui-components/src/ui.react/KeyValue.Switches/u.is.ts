import { Is as StdIs, type t } from './common.ts';

/** Local item guards for KeyValue.Switches projection inputs. */
function hr(item: t.KeyValueSwitches.Item): item is t.KeyValue.Item.Hr {
  return StdIs.object(item) && 'kind' in item && item.kind === 'hr';
}

function group(item: t.KeyValueSwitches.Item): item is t.KeyValueSwitches.Group {
  return StdIs.object(item) && 'kind' in item && item.kind === 'group';
}

function row(item: t.KeyValueSwitches.Item): item is t.KeyValueSwitches.Row {
  return !hr(item) && !group(item);
}

export const SwitchesIs: t.KeyValueSwitches.Is.Lib = { hr, group, row };
