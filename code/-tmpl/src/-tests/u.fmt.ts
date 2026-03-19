import { type t, c } from '../-test.ts';

export const Fmt = {
  slowRepoWorkspaceNote(min: t.Secs = 10, max: t.Secs = 30) {
    const msg = `note: expected to take ${min}-${max}s while the generated repo workspace is prepared and verified`;
    return c.italic(c.brightCyan(msg));
  },
} as const;
