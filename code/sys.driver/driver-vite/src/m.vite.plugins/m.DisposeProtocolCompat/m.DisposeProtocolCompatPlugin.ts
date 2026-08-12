import MagicString from 'magic-string';
import { Is, type t } from './common.ts';

const COMPAT_SPECIFIER = '@sys/std/dispose/compat';
const COMPAT_IMPORT = `import '${COMPAT_SPECIFIER}';\n`;
const SOURCE_ID = /\.(?:[cm]?[jt]sx?)$/;

type ParserLanguage = 'js' | 'jsx' | 'ts' | 'tsx';
type ParsedProgram = ReturnType<t.Rollup.PluginContext['parse']>;

/** Create the client-only disposal-protocol compatibility delivery plugin. */
function plugin(): t.VitePlugin {
  const bootstrapIds = new Set<string>();

  return {
    name: 'sys:dispose-protocol-compat',
    enforce: 'pre',
    applyToEnvironment(environment) {
      const consumer = environment.config.consumer;
      return consumer === 'client' || (consumer === undefined && environment.name === 'client');
    },
    async resolveId(source, importer, options) {
      const isCompatRoot = source === COMPAT_SPECIFIER;
      const isCompatDependency = Is.str(importer) && bootstrapIds.has(cleanModuleId(importer));
      if (!isCompatRoot && !isCompatDependency) return null;

      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
      if (resolved && !resolved.external) bootstrapIds.add(cleanModuleId(resolved.id));
      if (isCompatRoot) return resolved;
      return null;
    },
    moduleParsed(info) {
      if (!bootstrapIds.has(cleanModuleId(info.id))) return;
      for (const id of info.importedIds) bootstrapIds.add(cleanModuleId(id));
    },
    async transform(code, id) {
      const cleanId = cleanModuleId(id);
      const lang = parserLanguage(cleanId);
      if (!lang) return null;

      await resolveCompatRoot(this, cleanId, bootstrapIds);
      if (bootstrapIds.has(cleanId)) return null;

      const program = this.parse(code, { lang, sourceType: 'module' });
      if (hasCompatImport(program)) return null;

      const source = new MagicString(code, { filename: cleanId });
      source.appendLeft(insertionOffset(code, program), COMPAT_IMPORT);
      return {
        code: source.toString(),
        map: source.generateMap({ hires: true, includeContent: true, source: cleanId }),
        moduleSideEffects: true,
      };
    },
  };
}

export const DisposeProtocolCompatPlugin: t.DisposeProtocolCompatPlugin.Lib = { plugin };

async function resolveCompatRoot(
  context: t.Rollup.PluginContext,
  importer: string,
  bootstrapIds: Set<string>,
) {
  const resolved = await context.resolve(COMPAT_SPECIFIER, importer, { skipSelf: true });
  if (resolved && !resolved.external) bootstrapIds.add(cleanModuleId(resolved.id));
}

function cleanModuleId(id: string) {
  const index = id.search(/[?#]/);
  return index < 0 ? id : id.slice(0, index);
}

function parserLanguage(id: string): ParserLanguage | undefined {
  if (!SOURCE_ID.test(id)) return undefined;
  if (id.endsWith('.tsx')) return 'tsx';
  if (id.endsWith('.jsx')) return 'jsx';
  if (/\.[cm]?ts$/.test(id)) return 'ts';
  return 'js';
}

function insertionOffset(code: string, program: ParsedProgram) {
  const end = program.hashbang?.end;
  if (end === undefined) return 0;
  if (code.startsWith('\r\n', end)) return end + 2;
  return code[end] === '\n' || code[end] === '\r' ? end + 1 : end;
}

function hasCompatImport(program: ParsedProgram) {
  return program.body.some((node) =>
    node.type === 'ImportDeclaration' &&
    node.specifiers.length === 0 &&
    Is.object(node.source) &&
    node.source.value === COMPAT_SPECIFIER
  );
}
