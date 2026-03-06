import { Cli, Fs, Hash, Is, c, Http } from '../src/common.ts';

export async function checkSha256(args: {
  localDmgPath: string;
  remoteDistUrl: string;
  remoteDmgUrl: string;
  dmgName: string;
}) {
  const client = Http.fetcher();
  const spin = Cli.spinner();

  spin.start(c.gray(c.italic('hashing local dmg...')));
  const localRead = await Fs.read(args.localDmgPath);
  spin.stop();

  spin.start(c.gray(c.italic('fetching remote dist.json...')));
  const remoteDist = await client.json<Record<string, unknown>>(args.remoteDistUrl);
  spin.stop();

  spin.start(c.gray(c.italic('fetching and hashing remote dmg...')));
  const remoteRes = await fetch(args.remoteDmgUrl);
  spin.stop();
  if (!localRead.ok || !localRead.data) throw new Error(`Failed to read local dmg: ${args.localDmgPath}`);

  if (!remoteDist.ok) throw new Error(`Failed to load dist.json: ${args.remoteDistUrl}`);
  if (!remoteRes.ok) throw new Error(`Failed to load remote dmg: ${remoteRes.status} ${args.remoteDmgUrl}`);

  const remoteBytes = new Uint8Array(await remoteRes.arrayBuffer());
  const parts = (remoteDist.data?.hash as { parts?: Record<string, string> } | undefined)?.parts ?? {};
  const rawPart = parts[args.dmgName] ?? '';
  const expected = String(rawPart).split(':')[0] ?? '';
  const local = Hash.sha256(localRead.data);
  const remote = Hash.sha256(remoteBytes);

  const rows = Cli.table().padding(1);
  rows.push([c.gray('remote dmg url'), c.white(args.remoteDmgUrl)]);
  rows.push([c.gray('dist.json expected'), c.white(expected)]);
  rows.push([c.gray('local file'), c.white(local)]);
  rows.push([c.gray('remote file'), c.white(remote)]);
  rows.push([c.gray('expected == local'), expected === local ? c.green('PASS') : c.red('FAIL')]);
  rows.push([c.gray('expected == remote'), expected === remote ? c.green('PASS') : c.red('FAIL')]);
  rows.push([c.gray('local == remote'), local === remote ? c.green('PASS') : c.red('FAIL')]);
  console.info(`\n${c.bold(c.cyan('DMG SHA256 Check'))}\n`);
  console.info(String(rows));

  if (!Is.str(expected) || !expected.startsWith('sha256-')) throw new Error(`Missing dmg digest in dist.json for: ${args.dmgName}`);
  if (expected !== local || expected !== remote || local !== remote) throw new Error('sha256 mismatch across dist/local/remote');
}

async function main(args: {
  localDmgPath: string;
  remoteDistUrl: string;
  remoteDmgUrl: string;
  dmgName: string;
}) {
  await checkSha256(args);
}

/**
 * Disposable check for dmg integrity across local staging and published endpoint.
 */
await main({
  localDmgPath: '/Users/phil/code/org.sys/sys/code/sys.tools/.tmp/releases/v0.0.0-stage0/System_0.1.0_aarch64.dmg',
  remoteDistUrl: 'https://fs.db.team/releases/sys.app.shell/v0.0.0-stage0/dist.json',
  remoteDmgUrl: 'https://fs.db.team/releases/sys.app.shell/v0.0.0-stage0/System_0.1.0_aarch64.dmg',
  dmgName: 'System_0.1.0_aarch64.dmg',
});
