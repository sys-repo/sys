/**
 * @module
 */
import type { t } from './common.ts';
import { useRepo } from './use.Repo.ts';
import { Repo as View } from './ui.tsx';

export const Repo: t.RepoLib = {
  View,
  useRepo,
};
