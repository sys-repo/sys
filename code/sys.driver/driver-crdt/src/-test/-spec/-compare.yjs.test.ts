import { comparison } from '../-compare/u/u.spec.ts';
import { yjsNative } from '../-compare/u/u.yjs.ts';

comparison({
  name: 'Yjs',
  worker: new URL('../-compare/u/u.worker.yjs.ts', import.meta.url),
  replica: yjsNative,
  formatted: [{ insert: 'a', attributes: { bold: true } }, { insert: 'c' }],
  draftRef: false,
  rollback: false,
});
