import type { t } from '../common.ts';
import { transport } from './m.transport.ts';
import { websocket } from './m.websocket.ts';

/** Typed client adapters for Files command surfaces. */
export const Client: t.Files.Client.Lib = { transport, websocket };
