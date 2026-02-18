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
  await registerHostTypeBarrels({ targetDir: dirs.target as t.StringDir, toolName: name });
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

/**
 * Register generated tool types into host type barrels when present.
 * No-op outside `sys.tools/src` style layouts.
 */
export async function registerHostTypeBarrels(args: { targetDir: t.StringDir; toolName: string }) {
  const hostDir = Fs.dirname(args.targetDir);
  const targetName = Fs.basename(args.targetDir);
  const lines = {
    commonT: `export type * from '../${targetName}/t.ts';`,
    types: `export type { ${args.toolName}Tool } from './${targetName}/t.namespace.ts';`,
  } as const;

  await appendUniqueLine(Fs.join(hostDir, 'common/t.ts'), lines.commonT);
  await appendUniqueLine(Fs.join(hostDir, 'types.ts'), lines.types);
}

async function appendUniqueLine(path: t.StringPath, line: string) {
  const read = await Fs.readText(path);
  if (!read.ok || read.data === undefined) return;

  const text = read.data;
  if (text.includes(line)) return;
  const trimmed = text.endsWith('\n') ? text.trimEnd() : text;
  const next = `${trimmed}\n${line}\n`;
  await Fs.write(path, next, { force: true });
}
