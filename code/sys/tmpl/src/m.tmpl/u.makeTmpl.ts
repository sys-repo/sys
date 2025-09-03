import { json } from './-bundle.ts';
import { type t, TmplEngine } from './common.ts';

export async function makeTmpl(root: t.TemplateName) {
  const fileProcessor: t.FileMapProcessor = async (e) => {
    // Strip the root prefix from the path so files land at the target-root.
    if (e.path.startsWith(`${root}/`)) {
      const next = e.path.slice(root.length + 1);
      if (!next) return e.skip('error: empty path after strip');
      e.target.rename(next, true);
    }
  };

  /**
   * Filtered template:
   */
  type F = t.FileMapFilterArgs;
  const inScope = (e: F) => e.path.startsWith(`${root}/`);
  const notHidden = (e: F) => e.filename !== '.tmpl.ts'; // NB: the initialization script for the template: IS NOT content.

  const tmpl = TmplEngine
    //
    .makeTmpl(json, fileProcessor)
    .filter(inScope)
    .filter(notHidden);

  return tmpl;
}
