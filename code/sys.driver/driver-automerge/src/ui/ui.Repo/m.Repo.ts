import type { t } from './common.ts';
import { SyncSwitch } from './ui.SyncSwitch.tsx';
import { Info } from './ui.Info.tsx';
import { StatusBullet } from './ui.StatusBullet.tsx';

/** Repository status and sync UI components. */
export const Repo: t.Repo.Lib = {
  Info,
  StatusBullet,
  SyncSwitch,
};
