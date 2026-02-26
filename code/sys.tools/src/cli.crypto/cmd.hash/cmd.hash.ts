import { type t, c, Fs, Time } from '../common.ts';
import { HashFmt } from './u.fmt.ts';
import { HashJobSchema } from './u.hash.schema.ts';
import { runHashJob } from './u.hash.ts';

export async function hashCurrentDir(cwd: t.StringDir): Promise<void> {
  const dir = Fs.resolve(cwd);
  const job = HashJobSchema.initial(dir);
  const startedAt = Time.now.timestamp;
  const res = await runHashJob(job);
  const elapsed = String(Time.elapsed(startedAt));

  console.info();
  console.info(c.green('✔ directory hashed'));
  console.info();
  console.info(HashFmt.result(res, { elapsed, dirLabel: './' }));
}
