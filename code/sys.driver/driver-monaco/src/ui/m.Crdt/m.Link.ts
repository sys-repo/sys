import type { t } from './common.ts';

import { enable } from './u.Link.enable.ts';
import { create } from './u.Link.create.ts';
import { register } from './u.Link.register.ts';

export const Link: t.EditorCrdtLinkLib = {
  register,
  create,
  enable,
};
