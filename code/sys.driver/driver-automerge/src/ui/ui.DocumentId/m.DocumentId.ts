import type { t } from './common.ts';

import { Parse } from './u.Parse.ts';
import { View } from './ui.tsx';
import { useController } from './use.Controller.ts';

/** Document-id view, parser, and controller helpers. */
export const DocumentId: t.DocumentId.Lib = {
  View,
  Parse,
  useController,
};
