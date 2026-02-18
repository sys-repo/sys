import { type t, Cli, Fs, TmplEngine } from '../common.ts';
import { applyTemplateVariant, makeBaseTemplateProcessor } from './u.variant.ts';

/**
 * Clone the current template into a target directory.
 */
export async function cloneTemplate(cwd: t.StringDir, variant: t.__NAME__Tool.TemplateVariant) {
  const dirname = await Cli.Input.Text.prompt('Clone to directory (name):');
  const dirs = {
    target: Fs.join(cwd, dirname),
    source: resolveTemplateRootFromImport(import.meta.url),
  };

  const name = await Cli.Input.Text.prompt('__NAME__ → MyToolName');
  const processFile = makeBaseTemplateProcessor({ name });

  await TmplEngine.makeTmpl(dirs.source, processFile).write(dirs.target);
  await applyTemplateVariant({
    dir: dirs.target as t.StringDir,
    variant,
    name,
  });
}

/**
 * Resolve `-tmpl.cli` root directory from files within `-tmpl.cli/u.tmpl`.
 */
export function resolveTemplateRootFromImport(importMetaUrl: string): t.StringDir {
  const sourceDir = Fs.dirname(Fs.Path.fromFileUrl(importMetaUrl));
  return Fs.dirname(sourceDir) as t.StringDir;
}
