import { c, Cli, Fs, type t } from './common.ts';

export const Fmt = {
  spinnerText(text: string) {
    return Cli.Fmt.spinnerText(text, false);
  },

  slugDatasetProgress(info: t.SlcDataPipeline.StageSlugDataset.Progress): string {
    if (info.stage === 'mount') {
      return Fmt.spinnerText(
        `staging slug dataset ${c.white(info.mount)} (${c.white(String(info.current))}/${info.total} mounts)`,
      );
    }
    return Fmt.spinnerText(
      `staging ${c.white(info.mount)} (${c.white(String(info.current))}/${info.total} docs)`,
    );
  },

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

  result(result: t.SlcDataCli.Result): string {
    if (result.kind === 'help') return result.text;
    if (result.kind === 'created') {
      return `${c.green('✔')} ${c.gray('Created profile:')} ${c.cyan(Fs.trimCwd(result.path))}`;
    }
    if (result.kind === 'staged') return Fmt.staged(result);
    if (result.kind === 'refresh-root') return Fmt.refreshRoot(result);
    return '';
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
