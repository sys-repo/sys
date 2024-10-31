import { Hash } from '@sys/std-s';
import { Vault } from '@sys/driver-obsidian/s';

/**
 * Sample Vaul/Directory monitoring.
 */
const path = '/Users/phil/Documents/Notes/tdb';
const dir = await Vault.dir(path);

const res = await Hash.Dir.compute(dir.path);
console.log('Hash', res.hash, '\n');

await dir.listen({ log: true });
