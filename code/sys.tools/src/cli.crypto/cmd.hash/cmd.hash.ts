import { type t, c, Cli, Fs, Time } from '../common.ts';
import { HashFmt } from './u.fmt.ts';
import { HashJobSchema } from './u.hash.schema.ts';
import { HashRowDist } from './u.row.dist.ts';
import { HashPreflight } from './u.preflight.ts';
import { runHashJob } from './u.hash.ts';

export async function hashCurrentDir(cwd: t.StringDir): Promise<void> {
  await hashDir(cwd, '.');
}

export async function hashDir(
  cwd: t.StringDir,
  targetDir: string,
  opts: { saveDist?: boolean } = {},
): Promise<void> {
  const resolved = Fs.Path.resolve(cwd, targetDir);
  const dirLabel = HashFmt.dirLabel(resolved);
  const saveDist = opts.saveDist ?? false;
  const preflight = await HashPreflight.scan(resolved);
  if (HashPreflight.shouldConfirm(preflight)) {
    if (HashPreflight.isInteractive()) {
      const ok = await HashPreflight.confirmContinue(preflight);
      if (!ok) {
        console.info();
        console.info(c.gray('hash cancelled'));
        console.info();
        return;
      }
    } else {
      console.info();
      console.info(c.yellow(HashFmt.preflightWarning(preflight)));
      console.info();
    }
  }
  const distBefore = await HashRowDist.readBefore(resolved);
  const job = { ...HashJobSchema.initial(resolved), saveDist };
  const startedAt = Time.now.timestamp;
  const spinner = Cli.spinner(HashFmt.spinnerText(resolved));
  spinner.start();
  let res: Awaited<ReturnType<typeof runHashJob>>;
  try {
    res = await runHashJob(job);
  } finally {
    spinner.stop();
  }
  const elapsed = String(Time.elapsed(startedAt));

  const distRow = HashRowDist.afterRun({ before: distBefore, saveDist, digest: res.digest });

  console.info();
  console.info(c.green('✔ directory hashed'));
  console.info();
  console.info(
    HashFmt.result(res, {
      elapsed,
      dirLabel,
      dist: distRow,
    }),
  );
  console.info();
}
