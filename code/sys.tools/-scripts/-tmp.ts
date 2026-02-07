import { Env } from '@sys/fs';
import { Fs, Is, Json, Str } from '../src/common.ts';
import { backupConfig } from './-tmp.backup-config.ts';
import { runVoice } from './-tmp.voice.ts';

await runVoice();
// await backupConfig({ from: './.tmp/-config/', to: '~/code.data/-backup.from.sys-tmp/' });
// await backupConfig({ from: './.tmp/-config/', to: '../../-config/', snapshot: false, merge: true });
