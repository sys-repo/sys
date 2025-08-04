import type { PathJoinLib } from './t.ts';

import { join as auto } from '@std/path/join';
import { join as posix } from '@std/path/posix/join';
import { join as windows } from '@std/path/windows/join';

export const Join: PathJoinLib = {
  auto,
  posix,
  windows,
  platform(flag = 'auto') {
    if (flag === 'auto') return auto;
    if (flag === 'posix') return posix;
    if (flag === 'windows') return windows;
    throw new Error(`Platform flag not supported: ${flag}`);
  },
};
