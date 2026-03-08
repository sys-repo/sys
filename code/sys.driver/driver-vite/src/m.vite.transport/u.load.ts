import { Fs, Path } from './common.ts';
import { transform } from 'npm:esbuild@0.27.2';

export type DenoLoadResult =
  | string
  | {
      readonly code: string;
      readonly map: string | null;
    };

export async function loadDenoModule(id: string): Promise<DenoLoadResult> {
  const { loader, resolved } = parseDenoSpecifier(id);
  const content = (await Fs.readText(resolved)).data ?? '';

  if (loader === 'JavaScript') return content;
  if (loader === 'Json') return `export default ${content}`;

  const result = await transform(content, {
    format: 'esm',
    loader: mediaTypeToLoader(loader),
    logLevel: 'debug',
  });

  const map = result.map === '' ? null : result.map;
  return { code: result.code, map };
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

export function parseDenoSpecifier(spec: string) {
  const [_, loader, id, posixPath] = spec.split('::');
  return {
    loader,
    id,
    resolved: Path.normalize(posixPath),
  };
}
