import type { DenoFileIsLib } from './t.ts';
import { load } from './u.load.ts';

export const Is: DenoFileIsLib = {
  /**
   * Determine if the given input is a `deno.json` file
   * that contains a "workspace":[] configuration.
   */
  async workspace(input) {
    const { exists, data } = await load(input);
    return exists ? Array.isArray(data?.workspace) : false;
  },
};
