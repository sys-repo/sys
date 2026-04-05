import { c, Fs, type t } from './common.ts';

export const Fmt = {
  error(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    return `${c.red('Error:')} ${message}`;
  },

  staged(result: { readonly dir: t.StringDir } | t.SlcDataCli.StageProfile.StageResult): string {
    if ('dir' in result) {
      return `${c.green('✔')} ${c.gray('Staged mount:')} ${c.cyan(Fs.trimCwd(result.dir))}`;
    }
    if (result.dirs.length === 1) {
      return `${c.green('✔')} ${c.gray('Staged mount:')} ${c.cyan(Fs.trimCwd(result.dirs[0]!))}`;
    }
    return [
      `${c.green('✔')} ${c.gray('Staged mounts:')}`,
      ...result.dirs.map((dir) => `- ${c.cyan(Fs.trimCwd(dir))}`),
    ].join('\n');
  },

  refreshRoot(result: t.SlcDataCli.RefreshResult): string {
    return `${c.green('✔')} ${c.gray('Refreshed mounts index:')} ${c.cyan(Fs.trimCwd(result.mountsPath))}`;
  },

  validationErrors(errors: readonly t.ValueError[]): string {
    return errors
      .slice(0, 3)
      .map((error) => {
        const path = error.path || '<root>';
        return `${path}: ${error.message}`;
      })
      .join('; ');
  },
} as const;
