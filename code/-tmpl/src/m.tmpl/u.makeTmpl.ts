import { json } from './-bundle.ts';
import { type t, TmplEngine } from './common.ts';

export async function makeTmpl(root: t.TemplateName) {
  const fileProcessor: t.FileMapProcessor = async (e) => {
    // Strip the root prefix from the path so files land at the target-root.
    if (e.path.startsWith(`${root}/`)) {
      const rel = e.path.slice(root.length + 1);
      if (!rel) return e.skip('error: empty path after strip');
      e.target.rename(wrangle.stagedManifest(rel), true);
    }
  };

  /**
   * Filtered template:
   */
  type F = t.FileMapFilter;
  const inScope: F = (e) => e.path.startsWith(`${root}/`);
  const notHidden: F = (e) => e.filename !== '.tmpl.ts'; // NB: the initialization script for the template: IS NOT content.

  const tmpl = TmplEngine
    //
    .makeTmpl(json, fileProcessor)
    .filter(inScope)
    .filter(notHidden);

  return tmpl;
}

const wrangle = {
  stagedManifest(path: string) {
    const parts = path.split('/');
    const name = parts.at(-1);
    if (name === '-deno.json') parts[parts.length - 1] = 'deno.json';
    if (name === '-package.json') parts[parts.length - 1] = 'package.json';
    return parts.join('/');
  },
} as const;
