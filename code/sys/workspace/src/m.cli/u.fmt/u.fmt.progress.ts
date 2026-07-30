import { c, Cli, type t } from '../common.ts';
import type { RegistryProgress } from './u.fmt.t.ts';

export const FmtProgress = {
  spinnerText(text: string, spacing: t.Cli.Fmt.Spinner.Spacing = true): string {
    return Cli.Fmt.spinnerText(text, spacing);
  },

  spinnerRaw(text: string, spacing: t.Cli.Fmt.Spinner.Spacing = true): string {
    return Cli.Fmt.spinnerRaw(text, spacing);
  },

  spinnerProgress(progress: t.WorkspaceUpgrade.Progress): string {
    if (!FmtProgress.isRegistryProgress(progress)) {
      const msg = progress.kind === 'plan'
        ? 'composing upgrade plan...'
        : 'applying workspace upgrades...';
      return FmtProgress.spinnerText(c.gray(msg));
    }

    const registry = progress;
    const percent = FmtProgress.progressPercent(registry);
    const current = `${
      FmtProgress.spinnerRegistryCount('jsr', registry.current.jsr, registry.total.jsr)
    } ${FmtProgress.spinnerRegistryCount('npm', registry.current.npm, registry.total.npm)}`;
    const label = FmtProgress.spinnerText('checking registry... ', false);
    const open = FmtProgress.spinnerText('(', false);
    const close = FmtProgress.spinnerText(') • ', false);
    const done = c.white(`${percent}%`);
    const text = `${label}${open}${current}${close}${done}`;
    return FmtProgress.spinnerRaw(text);
  },

  spinnerRegistryCount(registry: 'jsr' | 'npm', current: number, total: number): string {
    const label = total > 0 && current >= total ? c.green(`${registry}:`) : c.cyan(`${registry}:`);
    return `${label}${c.white(String(current))}${c.gray(`/${total}`)}`;
  },

  isRegistryProgress(progress: t.WorkspaceUpgrade.Progress): progress is RegistryProgress {
    return progress.kind === 'registry';
  },

  progressPercent(progress: RegistryProgress): number {
    if (progress.dependencies <= 0) return 100;
    const clamped = Math.max(0, Math.min(progress.completed, progress.dependencies));
    return Math.max(0, Math.min(100, Math.floor((clamped / progress.dependencies) * 100)));
  },
} as const;
