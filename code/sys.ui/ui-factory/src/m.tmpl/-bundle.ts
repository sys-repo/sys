/**
 * Embedded template bundle and bundle-maintenance helpers.
 */
import { Fs, TmplEngine } from '@sys/tmpl-engine';
import type { t } from '../common.ts';
import file from './-bundle.json' with { type: 'json' };
export const json = file as t.FileMap;

export const PATHS = resolvePaths(import.meta.url);

/**
 * Prepare embedded asset bundle of template files.
 */
export async function makeBundle() {
  if (PATHS.root.length === 0) {
    throw new Error('ui-factory templates can only be bundled from a local file workspace.');
  }

  const bundle = await TmplEngine.FileMap.bundle(PATHS.files, PATHS.json);
  console.info(TmplEngine.Log.bundled(bundle));
}

export function makeProcessor(bundleRoot: t.StringDir): t.FileMapProcessor {
  const root = (bundleRoot ?? '').trim();
  const prefix = root ? `${root}/` : '';

  return async (e) => {
    if (root) {
      const isUnderRoot = e.path === root || e.path.startsWith(prefix);
      if (!isUnderRoot) return e.skip(`not within "${root}/"`);
    }

    if (root && e.path.startsWith(prefix)) {
      const next = e.path.slice(prefix.length);
      if (!next) return e.skip('empty path after strip');
      e.target.rename(next, true);
    }

    if (e.text && e.path.endsWith('.gitignore-')) {
      e.target.rename(e.path.replace(/-$/, ''));
    }
  };
}

function resolvePaths(url: string) {
  if (!url.startsWith('file:')) {
    return {
      root: '',
      files: '',
      json: '',
    } as const;
  }

  const root = Fs.dirname(Fs.Path.fromFileUrl(url));
  const pkg = Fs.dirname(Fs.dirname(root));
  return {
    root,
    files: Fs.join(pkg, '-tmpl'),
    json: Fs.join(root, '-bundle.json'),
  } as const;
}
