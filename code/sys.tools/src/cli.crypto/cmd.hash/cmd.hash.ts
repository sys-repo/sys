import { type t, c, Fs } from '../common.ts';
import { HashFmt } from './u.fmt.ts';
import { HashJobSchema } from './u.hash.schema.ts';
import { runHashJob } from './u.hash.ts';

export async function hashCurrentDir(cwd: t.StringDir): Promise<void> {
  const dir = Fs.resolve(cwd);
  const job = HashJobSchema.initial(dir);
  const res = await runHashJob(job);

  console.info();
  console.info(c.green('✔ directory hashed'));
  console.info();
  console.info(HashFmt.result(res));
}
