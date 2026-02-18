import { type t, Cli, Fs, TmplEngine } from './common.ts';

/**
 * Clone the current template into a target directory.
 */
export async function cloneTemplate(cwd: t.StringDir, _variant: t.__NAME__Tool.TemplateVariant) {
  const dirname = await Cli.Input.Text.prompt('Clone to directory (name):');
  const dirs = {
    target: Fs.join(cwd, dirname),
    source: Fs.dirname(Fs.Path.fromFileUrl(import.meta.url)),
  };

  const name = await Cli.Input.Text.prompt('__NAME__ → MyToolName');
  const tmpl = TmplEngine.makeTmpl(dirs.source, async (e) => {
    const replaced = (e.text ?? '').replaceAll('__NAME__', name);
    e.modify(replaced);
  });

  // Placeholder: variants currently share identical generation behavior.
  await tmpl.write(dirs.target);
}
