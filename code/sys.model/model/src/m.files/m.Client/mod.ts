import type { t } from '../common.ts';
import { local } from './m.local.ts';
import { transport } from './m.transport.ts';
import { websocket } from './m.websocket.ts';

/** Typed client adapters for Files command surfaces. */
export const Client: t.Files.Client.Lib = { local, transport, websocket };
