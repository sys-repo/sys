import { Path, type t } from '../common.ts';
import { fromExtension } from './u.fromExtension.ts';

export const fromPath: t.MediaType.Resolve.FromPath = (path, options) => {
  const filename = Path.basename(path);
  const extension = isExtensionOnlyDotfile(filename) ? filename : Path.extname(filename);
  return extension ? fromExtension(extension, options) : undefined;
};

/**
 * Helpers:
 */

function isExtensionOnlyDotfile(filename: string): boolean {
  return filename.startsWith('.') && filename.indexOf('.', 1) < 0;
}
