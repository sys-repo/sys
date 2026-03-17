/**
 * Isolated module with the { type: 'json' } import.
 */
import { type t, FileMap, Str, TmplEngine } from '../common.ts';
import file from './-bundle.json' with { type: 'json' };

export const json = file as Record<string, unknown>;
const TARGET_DIR_TOKEN = '__TARGET_DIR__';

export function renderStageEntrypoints(targetDir: t.StringRelativeDir) {
  const { fileMap } = TmplEngine.FileMap.validate(json);
  if (!fileMap) throw new Error('Invalid staged entry template bundle.');
  return {
    entry: render(fileMap, 'entry.ts.tmpl', targetDir),
    entryPaths: render(fileMap, 'entry.paths.ts.tmpl', targetDir),
  } as const;
}

function render(
  fileMap: Record<string, unknown>,
  filename: 'entry.ts.tmpl' | 'entry.paths.ts.tmpl',
  targetDir: t.StringRelativeDir,
) {
  const data = fileMap[filename];
  if (!data) throw new Error(`Missing staged entry template: ${filename}`);
  const text = FileMap.Data.decode(String(data));
  if (typeof text !== 'string') throw new Error(`Expected text template: ${filename}`);
  return Str.replaceAll(text, TARGET_DIR_TOKEN, targetDir).after;
}
