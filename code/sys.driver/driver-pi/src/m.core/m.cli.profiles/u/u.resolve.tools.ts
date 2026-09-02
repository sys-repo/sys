import { Arr } from '../common.ts';
import { PI_AGENT_IMPORT_BASE } from '../../m.cli/u.resolve.pkg.ts';

type ToolSource = {
  builtin: string[];
  extension: string[];
};

type ResolveActiveToolNamesInput = {
  args?: string[];
  source: ToolSource;
};

export const PI_TOOL_SELECTION_IMPORT = `${PI_AGENT_IMPORT_BASE}@0.84.4` as const;

export const PI_BUILTIN_TOOL_NAMES = [
  'read',
  'bash',
  'powershell',
  'edit',
  'write',
  'grep',
  'find',
  'ls',
] as const;

const VALUE_FLAGS = new Set([
  '--mode',
  '--provider',
  '--model',
  '--api-key',
  '--system-prompt',
  '--append-system-prompt',
  '--session',
  '--session-id',
  '--fork',
  '--session-dir',
  '--models',
  '--thinking',
  '--export',
  '--extension',
  '-e',
  '--skill',
  '--prompt-template',
  '--theme',
]);

const BOOLEAN_FLAGS = new Set([
  '--help',
  '-h',
  '--version',
  '-v',
  '--continue',
  '-c',
  '--resume',
  '-r',
  '--no-session',
  '--no-extensions',
  '-ne',
  '--no-skills',
  '-ns',
  '--no-prompt-templates',
  '-np',
  '--no-themes',
  '--no-context-files',
  '-nc',
  '--verbose',
  '--approve',
  '-a',
  '--no-approve',
  '-na',
  '--offline',
]);

type ParsedToolSelection = {
  tools?: string[];
  excludeTools?: string[];
  noTools?: boolean;
  noBuiltinTools?: boolean;
  error?: boolean;
};

/** Resolve model-callable tools only when pinned Pi arguments prove the complete set. */
export function resolveActiveToolNames(
  input: ResolveActiveToolNamesInput,
): readonly string[] | undefined {
  const args = parseToolSelection(input.args ?? []);
  if (args.error) return;

  const selected = args.tools;
  const excluded = new Set(args.excludeTools ?? []);
  const source = input.source;
  const registered = (name: string) => {
    return source.builtin.includes(name) || source.extension.includes(name);
  };
  const active = selected !== undefined
    ? selected.filter(registered)
    : args.noTools
    ? []
    : args.noBuiltinTools
    ? source.extension
    : undefined;

  return active ? Arr.uniq(active.filter((name) => !excluded.has(name))) : undefined;
}

/**
 * Mirror Pi 0.84.4 token consumption only far enough to prove its tool selection.
 * Pi's root parser export initializes host-runtime modules, so keep launcher authority unchanged.
 */
function parseToolSelection(args: string[]) {
  const result: ParsedToolSelection = {};

  // Positional token consumption requires a cursor to preserve Pi's exact flag/value pairing.
  for (let cursor = 0; cursor < args.length; cursor += 1) {
    const arg = args[cursor];
    const next = args[cursor + 1];
    if (arg === '--') break;

    if ((arg === '--tools' || arg === '-t') && next !== undefined) {
      result.tools = toolList(next);
      cursor += 1;
      continue;
    }
    if ((arg === '--exclude-tools' || arg === '-xt') && next !== undefined) {
      result.excludeTools = toolList(next);
      cursor += 1;
      continue;
    }
    if (arg === '--no-tools' || arg === '-nt') {
      result.noTools = true;
      continue;
    }
    if (arg === '--no-builtin-tools' || arg === '-nbt') {
      result.noBuiltinTools = true;
      continue;
    }
    if (arg === '--name' || arg === '-n') {
      if (next === undefined) result.error = true;
      else cursor += 1;
      continue;
    }
    if (VALUE_FLAGS.has(arg)) {
      if (next !== undefined) cursor += 1;
      continue;
    }
    if (BOOLEAN_FLAGS.has(arg) || arg.startsWith('@')) continue;
    if (arg === '--print' || arg === '-p') {
      if (next !== undefined && !next.startsWith('@') && shouldPrintConsume(next)) cursor += 1;
      continue;
    }
    if (arg === '--use-theme') {
      if (next === undefined || next.startsWith('-')) result.error = true;
      else cursor += 1;
      continue;
    }
    if (arg === '--list-models') {
      if (next !== undefined && !next.startsWith('-') && !next.startsWith('@')) cursor += 1;
      continue;
    }
    if (arg === '--tui-mode') {
      if (next === 'regular' || next === 'fullscreen') cursor += 1;
      else {
        result.error = true;
        if (next !== undefined && !next.startsWith('-')) cursor += 1;
      }
      continue;
    }
    if (arg.startsWith('--')) {
      if (
        !arg.includes('=') && next !== undefined && !next.startsWith('-') && !next.startsWith('@')
      ) {
        cursor += 1;
      }
      continue;
    }
    if (arg.startsWith('-')) result.error = true;
  }

  return result;
}

function toolList(value: string) {
  return value.split(',').map((name) => name.trim()).filter((name) => name.length > 0);
}

function shouldPrintConsume(value: string) {
  return !value.startsWith('-') || value.startsWith('---');
}
