import { join as auto } from '@std/path/join';
import { join as posix } from '@std/path/posix/join';
import { join as windows } from '@std/path/windows/join';
import { type t } from './common.ts';

export const Join: t.PathJoinLib = {
  auto,
  posix,
  windows,
};
