import { type t, Fs, TmplEngine } from '../common.ts';
import type { FileMapProcessor } from '@sys/fs/t';
import { replaceTemplateName } from './u.ts';

const YAML_VARIANT_DIR = '-tmpl.yaml-config';

/**
 * Base template processor:
 * - replaces "__NAME__" tokens
 * - excludes variant payload folders from base materialization
 */
export function makeBaseTemplateProcessor(args: { name: string }): FileMapProcessor {
  const { name } = args;
  return (e) => {
    if (e.path.startsWith(`${YAML_VARIANT_DIR}/`)) return e.skip('variant-payload');
    if (e.text) e.modify(replaceTemplateName(e.text, name));
  };
}

/**
 * Apply template variant overlays.
 */
export async function applyTemplateVariant(args: {
  dir: t.StringDir;
  variant: t.__NAME__Tool.TemplateVariant;
  name: string;
}) {
  if (args.variant === 'stateless') return;
  await applyYamlConfigVariant(args);
}

async function applyYamlConfigVariant(args: {
  dir: t.StringDir;
  name: string;
}) {
  const sourceDir = Fs.dirname(Fs.Path.fromFileUrl(import.meta.url));
  const overlayDir = Fs.join(sourceDir, '..', YAML_VARIANT_DIR);
  const processFile: FileMapProcessor = (e) => {
    if (e.target.filename.endsWith('.tmpl')) {
      e.target.rename(e.path.replace(/\.tmpl$/, ''), true);
    }
    if (e.text) e.modify(replaceTemplateName(e.text, args.name));
  };

  await TmplEngine.makeTmpl(overlayDir, processFile).write(args.dir, { force: true });
}
