import { Time } from '@sys/std-s';
import ora from 'npm:ora@8';
import type { Ora } from 'npm:ora@8';

export type CliLib = {
  spinner(text?: string): Ora;
};


  await ensureRef(path, { name: 'vite', version: '5.4.6' });
  await ensureRef(path, { name: 'tsx', version: '4.19.1' });
  await ensureRef(path, { name: 'vitest', version: '2.1.1' }, true);
  // await ensureRef(path, { name: 'typescript', version: '5.6.2' }, true);
}

console.log(c.green('-'));
console.log(`↑ dir: ${c.green(dir)}`);

console.log();
console.log(`${c.yellow('.mts')} files ↑`);
console.log(c.cyan('total'), paths.length);
