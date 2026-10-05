import { parseAst } from 'vite';
import { Is } from '../../../-test.ts';
import { DisposeProtocolCompatPlugin } from '../mod.ts';

type Plugin = ReturnType<typeof DisposeProtocolCompatPlugin.plugin>;
type ModuleParsed = (info: { id: string; importedIds: string[] }) => Promise<void> | void;
type TransformResult = {
  readonly code: string;
  readonly map: {
    readonly mappings?: string;
    readonly sources: readonly string[];
    readonly sourcesContent?: readonly (string | null)[];
  };
  readonly moduleSideEffects: boolean;
};
type Transform = (
  code: string,
  id: string,
) => Promise<TransformResult | null> | TransformResult | null;
type Resolve = (
  source: string,
  importer: string | undefined,
  options: { isEntry: boolean },
) => Promise<unknown> | unknown;

export function transformHook(plugin: Plugin): Transform {
  return hookHandler(plugin.transform, 'transform') as Transform;
}

export function moduleParsedHook(plugin: Plugin): ModuleParsed {
  return hookHandler(plugin.moduleParsed, 'moduleParsed') as ModuleParsed;
}

export function resolveHook(plugin: Plugin): Resolve {
  return hookHandler(plugin.resolveId, 'resolveId') as Resolve;
}

export function context(
  resolve: (source: string) => Promise<{ id: string } | null> = async () => null,
) {
  return {
    parse: parseAst,
    resolve,
  } as never;
}

function hookHandler(hook: unknown, name: string) {
  if (Is.func(hook)) return hook;
  if (Is.record<Record<string, unknown>>(hook) && Is.func(hook.handler)) return hook.handler;
  throw new Error(`Expected ${name} hook`);
}
