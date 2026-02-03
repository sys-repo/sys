import { type t, Time, c, Cli, Fmt, Fs, Is, Process } from '../../src/common.ts';
import { OrbiterCli } from '../../src/cli.deploy/u.providers/provider.orbiter/mod.ts';

export async function provisionObiter() {
  const cwd = Fs.resolve('./-scripts/-tmp.provision');
  console.info();
  console.info(c.bold(c.cyan('Provision Orbiter')));
  console.info('  cwd', c.gray(Fs.trimCwd(cwd)));

  // for (let shard = 0; shard < 10; shard++) await create(cwd, shard);
  for (let shard = 10; shard < 64; shard++) await create(cwd, shard);

  console.info();
}

async function create(cwd: t.StringDir, shard: t.Index, name: string = 'video-cdn-slc-tdb') {
  const startedAt = Time.now.timestamp;
  const domain = `${shard}-${name}`;
  const args = ['create', `--domain=${domain}`, './dist'];

  const spinner = Cli.spinner(c.gray(c.italic(`creating ${domain}`)));
  const out = await OrbiterCli.run(cwd, args);
  spinner.stop();
  const elapsed = Time.elapsed(startedAt);

  const table = Cli.table();
  table.push([c.cyan('Created')]);
  table.push([c.gray(' elapsed'), c.gray(elapsed.toString())]);
  table.push([c.gray(' name'), domain]);
  table.push([c.gray(' url'), `https://${domain}.orbiter.website`]);
  console.info(String(table));

  if (!out.success) {
    console.info('stdout', out.text.stdout);
    console.info('stderr', out.text.stderr);
  }

  console.info();
  return out;
}
