/**
 * @module
 */
import type { t } from './common.ts';
import { View } from './ui.tsx';
import { useController } from './use.Controller.ts';

export const DocumentId: t.DocumentIdLib = {
  View,
  useController,
};
