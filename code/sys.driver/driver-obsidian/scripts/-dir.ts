import { Vault } from '@sys/driver-obsidian/s';

const path = '/Users/phil/Documents/Notes';
const dir = await Vault.dir(path);
await dir.listen({ log: true });
