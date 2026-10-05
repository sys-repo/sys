import { c, Cli } from '@sys/cli';
import { Vault } from '@sys/driver-obsidian/s';
import { Fs } from '@sys/fs';
import { rx } from '@sys/std/rx';

/**
 * Sample vault/directory monitoring.
 */

const PATH = {
  from: { base: '/sample/vault' },
  to: { base: '/sample/site' },
};

const path = '/sample/vault';
const dir = await Vault.dir(path);

// const hx = await Hash.Dir.compute(path);
// console.log('Hash', hx.hash, '\n');

const listener = await dir.listen({ log: true });

listener.$.pipe(
  rx.filter((e) => e.paths.some((p) => p.startsWith('/sample/vault/content'))),
).subscribe(async (e) => {
  for (const from of e.paths) {
    const to = Fs.join(PATH.to.base, from.substring(PATH.from.base.length + 1));

    console.log(c.cyan('copy'));
    const table = Cli.table([c.green('- from'), c.gray(from)]);
    table.push([c.green('- to'), c.gray(to)]);
    table.render();
    console.info();

    await Fs.copy(from, to, { force: true });
  }
});
