import { Fs } from '@sys/fs';

/**
 * Clean transient launcher/runtime cache only. Persistent Pi state lives under
 * `./.pi` and must not be removed by the normal clean task.
 */
await Fs.remove('./.tmp', { log: true });
