import { type t } from './common.ts';

export function createFileProcessor(_ctx?: unknown): t.FileMapProcessFile {
  return async (e) => {
    // Example: rename ".gitignore-" → ".gitignore" (keep template committed).
    if (e.path.endsWith('.gitignore-')) {
      e.target.rename(e.target.relative.replace(/\.gitignore-$/, '.gitignore'));
    }

    // Example: token replacement.
    if (e.text && e.path.endsWith('deno.json')) {
      e.modify(e.text.replace(/<UI_FACTORY_ENTRY>/g, 'jsr:@sys/ui-factory/main'));
    }

    // Example: drop template sentinels.
    if (e.path.endsWith('.keep')) e.exclude('sentinel');
  };
}
