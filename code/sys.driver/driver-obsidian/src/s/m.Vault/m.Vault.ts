import type { VaultLib } from './t.ts';

import { Fs, type t } from './common.ts';
import { listen } from './u.dir.listen.ts';

export const Vault: VaultLib = {
  async dir(path: t.StringPath) {
    const exists = await Fs.exists(path);
    const api: t.VaultDir = {
      path,
      exists,
      listen(options = {}) {
        return listen(path, options);
      },
    };
    return api;
  },
};
