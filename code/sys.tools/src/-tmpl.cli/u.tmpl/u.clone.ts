import { type t, Cli, Fs, TmplEngine } from '../common.ts';
import { applyTemplateVariant, makeBaseTemplateProcessor } from './u.variant.ts';
import { deriveToolId, isValidToolId } from './u.ts';

/**
 * Clone the current template into a target directory.
 */
export async function cloneTemplate(cwd: t.StringDir, variant: t.__NAME__Tool.TemplateVariant) {
  const dirname = await Cli.Input.Text.prompt('Clone to directory (name):');
  const dirs = {
    target: Fs.join(cwd, dirname),
    source: resolveTemplateRootFromImport(import.meta.url),
  };

  const name = await Cli.Input.Text.prompt('__NAME__ → MyTool');
  const id = await Cli.Input.Text.prompt({
    message: '__ID__ → tool-id',
    default: deriveToolId(name),
    validate(value) {
      return isValidToolId(String(value).trim()) || 'Use lowercase letters, numbers, and "-" (start with letter)';
    },
  });
  const toolId = id.trim();
  const processFile = makeBaseTemplateProcessor({ name, id: toolId });

  await TmplEngine.makeTmpl(dirs.source, processFile).write(dirs.target);
  await registerHostTypeBarrels({ targetDir: dirs.target as t.StringDir, toolName: name });
  await registerHostRootRegistry({
    targetDir: dirs.target as t.StringDir,
    toolName: name,
    toolId,
  });
  await applyTemplateVariant({
    dir: dirs.target as t.StringDir,
    variant,
    name,
    id: toolId,
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

/**
 * Register generated tool in root command/type runtime registry when host files exist.
 * No-op outside `sys.tools/src` style layouts.
 */
export async function registerHostRootRegistry(args: {
  targetDir: t.StringDir;
  toolName: string;
  toolId: string;
}) {
  const hostDir = Fs.dirname(args.targetDir);
  const targetName = Fs.basename(args.targetDir);
  await patchRootToolsCommand(Fs.join(hostDir, 't.namespace.ts'), args.toolName);
  await patchRootRegistry(Fs.join(hostDir, 'u.root/registry.ts'), {
    toolId: args.toolId,
    targetName,
  });
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

async function patchRootToolsCommand(path: t.StringPath, toolName: string) {
  const read = await Fs.readText(path);
  if (!read.ok || read.data === undefined) return;
  const text = read.data;
  const member = `t.${toolName}Tool.Id`;
  if (text.includes(member)) return;

  const start = text.indexOf('export type Command =');
  if (start < 0) return;
  const end = text.indexOf(';', start);
  if (end < 0) return;

  const block = text.slice(start, end + 1);
  const nextBlock = block.replace(/;\s*$/, `\n    | ${member};`);
  const next = `${text.slice(0, start)}${nextBlock}${text.slice(end + 1)}`;
  await Fs.write(path, next, { force: true });
}

async function patchRootRegistry(
  path: t.StringPath,
  args: { toolId: string; targetName: string },
) {
  const read = await Fs.readText(path);
  if (!read.ok || read.data === undefined) return;
  const text = read.data;
  const entry = `  { id: '${args.toolId}', aliases: undefined, load: () => import('../${args.targetName}/mod.ts') },`;
  if (text.includes(entry)) return;

  const start = text.indexOf('export const ROOT_REGISTRY = [');
  const end = text.indexOf('] as const satisfies readonly ToolRegistryItem[];');
  if (start < 0 || end < 0 || end <= start) return;

  const head = text.slice(0, end).trimEnd();
  const tail = text.slice(end);
  const next = `${head}\n${entry}\n${tail}`;
  await Fs.write(path, next, { force: true });
}
