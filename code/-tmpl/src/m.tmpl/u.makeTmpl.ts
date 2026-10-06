import { json } from './-bundle.ts';
import { type t, TmplEngine } from './common.ts';

/** The explicit file map is an internal seam for historical embedded-product controls. */
export function makeTmpl(root: t.TemplateName, fileMap: t.FileMap = json) {
  const fileProcessor: t.FileMap.Write.Processor.Method = (e) => {
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
  type F = t.FileMap.Filter.Predicate;
  const inScope: F = (e) => e.path.startsWith(`${root}/`);
  const notHidden: F = (e) => e.filename !== '.tmpl.ts'; // NB: the initialization script for the template: IS NOT content.

  const tmpl = TmplEngine
    //
    .makeTmpl(fileMap, fileProcessor)
    .filter(inScope)
    .filter(notHidden);

  return tmpl;
}

const wrangle = {
  stagedManifest(path: string) {
    const parts = path.split('/');
    const name = parts.at(-1);
    if (name === '-deno.json') parts[parts.length - 1] = 'deno.json';
    if (name === '-deps.yaml') parts[parts.length - 1] = 'deps.yaml';
    if (name === '-package.json') parts[parts.length - 1] = 'package.json';
    return parts.join('/');
  },
} as const;
