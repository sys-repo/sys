import { type t } from './common.ts';

import { Data } from './m.Data.ts';
import { Is } from './m.Is.ts';
import { bundle } from './u.bundle.ts';
import { fromJson } from './u.from.ts';
import { write } from './u.write.ts';

export const FileMap: t.FileMapLib = {
  Is,
  Data,
  bundle,
  write,
  fromJson,
};
