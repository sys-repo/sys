import { Cmd } from '../m.Cmd.ts';
import type { t } from './common.ts';

/** Create a local Cmd<T> host bound to one side of a MessageChannel. */
export const localTransport: t.CmdFixture.LocalTransportFactory = Cmd.Transport.local;
