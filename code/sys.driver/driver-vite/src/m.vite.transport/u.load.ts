import { Fs, Path, type t } from './common.ts';
import { transform } from 'npm:esbuild@0.27.3';
import { toViteNpmSpecifier } from './u.npm.ts';

export type DenoLoadResult =
  | string
  | {
      readonly code: string;
      readonly map: string | null;
    };

export async function loadDenoModule(
  id: string,
  dependencies: readonly t.DenoDependency[] = [],
): Promise<DenoLoadResult> {
  const { loader, resolved } = parseDenoSpecifier(id);
  const original = (await Fs.readText(resolved)).data ?? '';
  const content = rewriteResolvedImports(original, dependencies);

  if (loader === 'JavaScript') return content;
  if (loader === 'Json') return `export default ${content}`;

  const result = await transform(content, {
    format: 'esm',
    loader: mediaTypeToLoader(loader),
    logLevel: 'debug',
  });

  const map = result.map === '' ? null : result.map;
  return { code: rewriteResolvedImports(result.code, dependencies), map };
}

export function mediaTypeToLoader(media: string) {
  switch (media) {
    case 'JSX':
      return 'jsx';
    case 'JavaScript':
      return 'js';
    case 'Json':
      return 'json';
    case 'TSX':
      return 'tsx';
    case 'TypeScript':
      return 'ts';
    default:
      return 'js';
  }
}

function rewriteResolvedImports(
  content: string,
  dependencies: readonly t.DenoDependency[],
): string {
  return dependencies.reduce((next, dependency) => {
    const target = resolvedImportSpecifier(dependency);
    if (target === dependency.specifier) return next;

    const sources = new Set<string>([dependency.specifier]);
    if (dependency.specifier.startsWith('npm:')) {
      sources.add(toViteNpmSpecifier(dependency.specifier));
    }

    return [...sources].reduce(
      (text, source) => rewriteImportSpecifier(text, source, target),
      next,
    );
  }, content);
}

function resolvedImportSpecifier(dependency: t.DenoDependency) {
  const { resolvedSpecifier: specifier, localPath } = dependency;
  if (localPath && dependency.loader && isRemoteLike(specifier)) {
    return toBrowserDenoSpecifier(dependency.loader, specifier, localPath);
  }
  if (specifier.startsWith('file://')) return Path.fromFileUrl(specifier);
  if (specifier.startsWith('npm:')) return specifier;
  return specifier;
}

function isRemoteLike(specifier: string) {
  return (
    specifier.startsWith('http://') ||
    specifier.startsWith('https://') ||
    specifier.startsWith('jsr:')
  );
}

function toBrowserDenoSpecifier(loader: t.DenoLoader, id: string, resolved: string) {
  const specifier = `\0deno::${loader}::${id}::${Path.normalize(resolved)}`;
  return `/@id/${specifier.replace('\0', '__x00__')}`;
}

function rewriteImportSpecifier(content: string, source: string, target: string) {
  return content
    .replaceAll(`from '${source}'`, `from '${target}'`)
    .replaceAll(`from "${source}"`, `from "${target}"`)
    .replaceAll(`import('${source}')`, `import('${target}')`)
    .replaceAll(`import("${source}")`, `import("${target}")`);
}

export function parseDenoSpecifier(spec: string) {
  const [_, loader, id, posixPath] = spec.split('::');
  return {
    loader,
    id,
    resolved: Path.normalize(posixPath),
  };
}
