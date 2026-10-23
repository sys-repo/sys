import { type t } from '../common.ts';

export { CrdtCmd } from '../../m.Cmd/mod.ts';

type CmdContext<K extends t.CrdtCmdName> = Parameters<t.CrdtCmdHandlers[K]>[1];

/** Build the minimal host-side context required for direct handler tests. */
export function cmdContext<K extends t.CrdtCmdName>(name: K): CmdContext<K> {
  const controller = new AbortController();
  return {
    id: 'req-test',
    name,
    signal: controller.signal,
    emit: () => undefined,
  };
}
