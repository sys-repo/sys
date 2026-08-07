import { type t } from '../common.ts';

/** Canonical launcher-owned source for the verified local GUI runtime. */
export const START_GUI_SOURCE = Object.freeze({
  manifestUrl: 'http://localhost:8080/dist.json' as t.StringUrl,
  integrity:
    'sha256-07d24ba144edb1f84eb2db14b10fcd3c3470775ee389b518c0ae9a9b5b2ddfbc' as t.StringHash,
});
