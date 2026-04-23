import { Perf } from '../common/u.perf.ts';
import { Fs, Path, type t } from './common.ts';
import { transformSync } from 'npm:esbuild@0.28.0';
import { toViteNpmSpecifier } from './u.npm.ts';
import { parseDenoSpecifier, toDenoSpecifier } from './u.specifier.ts';

export type DenoLoadResult =
  | string
  | {
      readonly code: string;
      readonly map: string | null;
    };

export async function loadDenoModule(
  id: string,
  dependencies: readonly t.DenoDependency[] = [],
  options: {
    readonly browserIds?: boolean;
  } = {},
): Promise<DenoLoadResult> {
  const parsed = parseDenoSpecifier(id);
  const loader = parsed.loader as t.DenoLoader;
  const { resolved } = parsed;
  const end = Perf.section('transport.loadDenoModule', {
    id,
    loader,
    dependencies: dependencies.length,
    browserIds: options.browserIds ?? false,
  });
  const original = (await Fs.readText(resolved)).data ?? '';
  const content = rewriteResolvedImports(original, dependencies, options);

  if (loader === 'JavaScript') {
    end({ transform: false, bytes: content.length });
    return content;
  }
  if (loader === 'Json') {
    const code = `export default ${content}`;
    end({ transform: false, bytes: code.length });
    return code;
  }

  const transformed = await transformModule(content, loader, resolved);
  const code = rewriteResolvedImports(transformed.code, dependencies, options);
  end({ transform: true, bytes: code.length });
  return {
    code,
    map: transformed.map,
  };
}

async function transformModule(content: string, loader: t.DenoLoader, sourcefile: string) {
  const cli = Deno.env.get('ESBUILD_BINARY_PATH')?.trim();
  if (cli) return await transformModuleWithCli({ cli, content, loader, sourcefile });

  const end = Perf.section('transport.transform.esbuildSync', { loader, sourcefile });
  const result = transformSync(content, {
    format: 'esm',
    loader: mediaTypeToLoader(loader),
    logLevel: 'debug',
  });
  end({ bytes: result.code.length });

  return {
    code: result.code,
    map: result.map === '' ? null : result.map,
  } as const;
}

async function transformModuleWithCli(args: {
  cli: string;
  content: string;
  loader: t.DenoLoader;
  sourcefile: string;
}) {
  const end = Perf.section('transport.transform.esbuildCli', {
    loader: args.loader,
    sourcefile: args.sourcefile,
  });
  const child = new Deno.Command(args.cli, {
    args: [
      '--format=esm',
      `--loader=${mediaTypeToLoader(args.loader)}`,
      '--log-level=debug',
      `--sourcefile=${args.sourcefile}`,
    ],
    stdin: 'piped',
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();

  const writer = child.stdin.getWriter();
  await writer.write(new TextEncoder().encode(args.content));
  await writer.close();

  const output = await child.output();
  if (!output.success) {
    const stderr = new TextDecoder().decode(output.stderr);
    const stdout = new TextDecoder().decode(output.stdout);
    end({ ok: false });
    throw new Error(stderr || stdout || `esbuild transform failed: ${args.sourcefile}`);
  }

  const code = new TextDecoder().decode(output.stdout);
  end({ ok: true, bytes: code.length });
  return {
    code,
    map: null,
  } as const;
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
  options: {
    readonly browserIds?: boolean;
  },
): string {
  return dependencies.reduce((next, dependency) => {
    const target = resolvedImportSpecifier(dependency, options);
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

function resolvedImportSpecifier(
  dependency: t.DenoDependency,
  options: {
    readonly browserIds?: boolean;
  },
) {
  const { resolvedSpecifier: specifier, localPath } = dependency;
  if (localPath && dependency.loader && isRemoteLike(specifier)) {
    return options.browserIds
      ? toBrowserDenoSpecifier(dependency.loader, specifier, localPath)
      : toDenoSpecifier(dependency.loader, specifier, localPath);
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
