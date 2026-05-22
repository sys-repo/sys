import type { t } from '../common.ts';
import { websocket } from './m.websocket.ts';

/** Typed client adapters for Files command surfaces. */
export const Client: t.Files.Client.Lib = { websocket };
