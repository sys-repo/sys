import { type t, Fs, TmplEngine } from '../common.ts';
import { deriveToolId, replaceTemplateTokens } from './u.ts';

const YAML_VARIANT_DIR = '-tmpl.yaml-config';
const Anchor = {
  imports: '// [tmpl:variant.imports]',
  migrate: '// [tmpl:variant.migrate]',
  optionBStart: '// [tmpl:variant.option-b:start]',
  optionBEnd: '// [tmpl:variant.option-b:end]',
  types: '// [tmpl:variant.types]',
  exports: '// [tmpl:variant.exports]',
} as const;

const Inject = {
  cliImports(name: string) {
    return `import { yamlConfigsMenu } from './u.menu.yaml.ts';\nimport { ${name}Migrate } from './u.yaml/mod.ts';`;
  },
  cliMigrate(name: string) {
    return `await ${name}Migrate.run(cwd);`;
  },
  cliOptionB() {
    return `
    if (A === 'config') {
      const picked = await yamlConfigsMenu(cwd);
      if (picked.kind === 'exit') return done(0);
      if (picked.kind === 'selected') {
        console.info(c.gray(\`config: \${picked.key}\`));
      }
      continue;
    }`.trim();
  },
  namespaceConfigYaml() {
    return `  export namespace ConfigYaml {
    export type Doc = { name: string };
    export type DirName = \`-config/\${string}.\${Id}\`;
    export type Ext = '.yaml';
    export type YamlCheck =
      | { readonly ok: true; readonly doc: Doc }
      | { readonly ok: false; readonly errors: readonly t.Schema.Error[] };
  }`;
  },
  commonSchemaExport() {
    return `export { Schema } from '@sys/schema';`;
  },
} as const;

/**
 * Base template processor:
 * - replaces "Pull" tokens
 * - excludes variant payload folders from base materialization
 */
export function makeBaseTemplateProcessor(args: { name: string; id?: string }): t.FileMapProcessor {
  const { name } = args;
  const id = args.id ?? deriveToolId(name);
  return (e) => {
    if (e.path.startsWith(`${YAML_VARIANT_DIR}/`)) return e.skip('variant-payload');
    if (e.text) e.modify(replaceTemplateTokens(e.text, { name, id }));
  };
}

/**
 * Apply template variant overlays.
 */
export async function applyTemplateVariant(args: {
  dir: t.StringDir;
  variant: t.PullTool.TemplateVariant;
  name: string;
  id?: string;
}) {
  if (args.variant === 'stateless') return;
  await applyYamlConfigVariant(args);
}

async function applyYamlConfigVariant(args: { dir: t.StringDir; name: string; id?: string }) {
  const id = args.id ?? deriveToolId(args.name);
  const sourceDir = Fs.dirname(Fs.Path.fromFileUrl(import.meta.url));
  const overlayDir = Fs.join(sourceDir, '..', YAML_VARIANT_DIR);
  const processFile: t.FileMapProcessor = (e) => {
    if (e.target.filename.endsWith('.tmpl')) {
      e.target.rename(e.path.replace(/\.tmpl$/, ''), true);
    }
    if (e.text) e.modify(replaceTemplateTokens(e.text, { name: args.name, id }));
  };

  await TmplEngine.makeTmpl(overlayDir, processFile).write(args.dir, { force: true });
  await patchVariantAnchors(args.dir, args.name);
}

async function patchVariantAnchors(dir: t.StringDir, name: string) {
  await patchCliAnchors(Fs.join(dir, 'm.cli.ts'), name);
  await patchNamespaceAnchors(Fs.join(dir, 't.namespace.ts'));
  await patchCommonAnchors(Fs.join(dir, 'common.ts'));
}

async function patchCliAnchors(path: t.StringPath, name: string) {
  let text = await readTextOrThrow(path);

  text = insertAfterAnchor(text, Anchor.imports, Inject.cliImports(name));

  text = insertAfterAnchor(text, Anchor.migrate, Inject.cliMigrate(name));

  text = replaceBetweenAnchors(text, Anchor.optionBStart, Anchor.optionBEnd, Inject.cliOptionB());

  await Fs.write(path, text, { force: true });
}

async function patchNamespaceAnchors(path: t.StringPath) {
  const text = await readTextOrThrow(path);
  const next = insertAfterAnchor(text, Anchor.types, Inject.namespaceConfigYaml());
  await Fs.write(path, next, { force: true });
}

async function patchCommonAnchors(path: t.StringPath) {
  const text = await readTextOrThrow(path);
  const next = insertAfterAnchor(text, Anchor.exports, Inject.commonSchemaExport());
  await Fs.write(path, next, { force: true });
}

async function readTextOrThrow(path: t.StringPath): Promise<string> {
  const read = await Fs.readText(path);
  if (!read.ok || read.data === undefined) {
    throw new Error(`Unable to read file: ${path}`);
  }
  return read.data;
}

function insertAfterAnchor(text: string, anchor: string, block: string): string {
  if (countOccurrences(text, anchor) !== 1) throw new Error(`Missing or duplicate anchor: ${anchor}`);
  if (text.includes(block)) return text;
  return text.replace(anchor, `${anchor}\n${block}`);
}

function replaceBetweenAnchors(text: string, start: string, end: string, block: string): string {
  if (countOccurrences(text, start) !== 1) throw new Error(`Missing or duplicate anchor: ${start}`);
  if (countOccurrences(text, end) !== 1) throw new Error(`Missing or duplicate anchor: ${end}`);
  const i = text.indexOf(start);
  const j = text.indexOf(end);
  if (i < 0 || j < 0 || j <= i) {
    throw new Error(`Missing or invalid anchor range: ${start} ... ${end}`);
  }

  const head = text.slice(0, i + start.length);
  const tail = text.slice(j);
  return `${head}\n${block}\n${tail}`;
}

function countOccurrences(text: string, pattern: string): number {
  return text.split(pattern).length - 1;
}
