import { type t, Fs, PATHS, Templates, TmplEngine } from './common.ts';
import { TemplateSourceRoots } from '../m.Templates.ts';

const PREFIX = 'tmpl.';

export const FORBIDDEN_SEGMENTS = ['node_modules', '.deno', 'dist', 'coverage', '.tmp'] as const;
export const FORBIDDEN_FILES = ['deno.lock'] as const;

/**
 * Prepare embedded asset bundle of template files.
 */
export async function makeBundle() {
  const src = PATHS.templates;
  const targetFile = PATHS.json;
  await assertTemplateSourceClean(src);

  // NOTE: in the monorepo `-tmpl/*` folder the actual template folders
  //       are prefixed with '-tmpl/tmpl.<name>` naming format.
  const filter: t.FileMapFilter = (e) => isAllowedTemplateBundlePath(e.path);
  const res = await TmplEngine.bundle(src, {
    targetFile,
    filter,
    beforeWrite: (e) => e.modify(toPublicTemplateRoots(e.fileMap)),
  });

  console.info(TmplEngine.Log.bundled(res));
}

/**
 * Names of all templates.
 */
export const TemplateNames: readonly string[] = [...Object.keys(Templates)] as const;

/**
 * Helpers:
 */
export function isAllowedTemplateBundlePath(path: string) {
  const normalized = normalizePath(path);
  if (!normalized.startsWith(PREFIX)) return false;
  return !containsForbiddenSegment(normalized) && !isForbiddenFile(normalized);
}

export async function assertTemplateSourceClean(sourceRoot: t.StringDir) {
  const root = Fs.resolve(sourceRoot);
  const offenders: string[] = [];

  for (const sourceName of Object.values(TemplateSourceRoots)) {
    const templateRoot = Fs.join(root, `${PREFIX}${sourceName}`);
    for (const segment of FORBIDDEN_SEGMENTS) {
      const dir = Fs.join(templateRoot, segment);
      if (await Fs.exists(dir)) offenders.push(dir);
    }
    for (const filename of FORBIDDEN_FILES) {
      const file = Fs.join(templateRoot, filename);
      if (await Fs.exists(file)) offenders.push(file);
    }
  }

  if (offenders.length > 0) {
    const details = offenders.join('\n');
    const err = `Template source contains forbidden generated directories (clean before bundling):\n${details}`;
    throw new Error(err);
  }
}

function toPublicTemplateRoots(fileMap: t.FileMap) {
  return Object.entries(fileMap).reduce((acc, [key, value]) => {
    if (key.startsWith(PREFIX)) key = key.slice(PREFIX.length);
    key = toPublicTemplateRoot(key);
    acc[key] = value;
    return acc;
  }, {} as t.FileMap);
}

function toPublicTemplateRoot(path: string) {
  for (const [templateName, sourceRoot] of Object.entries(TemplateSourceRoots)) {
    if (path === sourceRoot) return templateName;
    if (path.startsWith(`${sourceRoot}/`)) return `${templateName}${path.slice(sourceRoot.length)}`;
  }
  return path;
}

function normalizePath(path: string) {
  return path.replace(/\\/g, '/').replace(/^\.\//, '');
}

function containsForbiddenSegment(path: string) {
  const normalized = normalizePath(path);
  return FORBIDDEN_SEGMENTS.some((segment) => {
    return (
      normalized === segment ||
      normalized.endsWith(`/${segment}`) ||
      normalized.includes(`/${segment}/`)
    );
  });
}

function isForbiddenFile(path: string) {
  const normalized = normalizePath(path);
  return FORBIDDEN_FILES.some((filename) => {
    return normalized === filename || normalized.endsWith(`/${filename}`);
  });
}
