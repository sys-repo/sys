import type { NoticeFile } from './t.ts';

export const PACKAGE_NAME = 'monaco-editor';
export const MOUNT = 'vs';
export const MAX_BYTES = 32 * 1024 * 1024;
export const NOTICE_FILES = [
  'LICENSE',
  'ThirdPartyNotices.txt',
] as const satisfies readonly NoticeFile[];
