import type { t } from './common.ts';
import { mock } from './m.mock.ts';

/** WebSocket test fixtures for Web Standards runtimes. */
export const WebSocket: t.WebFixture.WebSocket.Lib = Object.freeze({
  mock,
});
