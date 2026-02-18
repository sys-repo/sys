import { type t, Cli, Fs, TmplEngine } from '../common.ts';
import { applyTemplateVariant, makeBaseTemplateProcessor } from './u.variant.ts';

/**
 * Clone the current template into a target directory.
 */
export async function cloneTemplate(cwd: t.StringDir, variant: t.__NAME__Tool.TemplateVariant) {
  const dirname = await Cli.Input.Text.prompt('Clone to directory (name):');
  const dirs = {
    target: Fs.join(cwd, dirname),
    source: Fs.dirname(Fs.Path.fromFileUrl(import.meta.url)),
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
