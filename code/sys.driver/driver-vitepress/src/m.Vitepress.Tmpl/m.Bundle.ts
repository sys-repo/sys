import { type t } from './common.ts';

import { prep } from './m.Bundle.u.prep.ts';
import { saveToFilesystem } from './m.Bundle.u.save.ts';

export const Bundle: t.VitepressBundleLib = {
  prep,
  saveToFilesystem,
};
