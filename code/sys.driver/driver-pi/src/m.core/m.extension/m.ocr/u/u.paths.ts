import { Fs } from '../common.ts';

export function extensionFile(cwd: string) {
  return Fs.resolve(cwd, '.pi', '@sys', 'extensions', 'ocr', 'mod.ts');
}

export function tmpRoot(cwd: string) {
  return Fs.resolve(cwd, '.pi', '@sys', 'tmp', 'ocr');
}
