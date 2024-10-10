import { Cmd } from '../mod.ts';
import type { t } from './common.ts';

/**
 * Test helpers for finding values.
 */
export const Find = {
  queueId(doc: t.CmdTransport, index: number, paths?: t.CmdPaths) {
    const item = Cmd.Path.resolver(paths).queue.item(doc.current, index);
    return item.id();
  },
};
