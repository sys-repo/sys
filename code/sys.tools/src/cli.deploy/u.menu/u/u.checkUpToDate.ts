import { type t, c, Cli, Http, Is, Pkg, Str, Url } from './common.ts';

type Result =
  | { readonly ok: true; readonly localHash: string; readonly remoteHash: string }
  | { readonly ok: false; readonly reason: string; readonly error?: unknown };

export async function checkUpToDate(args: {
  stagingDir: t.StringDir;
  domain?: string;
}): Promise<Result> {
  const domain = String(args.domain ?? '').trim();
  if (!domain) return { ok: false, reason: 'no-domain' };

  const dist = (await Pkg.Dist.load(args.stagingDir)).dist;
  const localHash = String(dist?.hash?.digest ?? '').trim();
  if (!localHash) return { ok: false, reason: 'no-local-hash' };

  const base = toHttpsUrl(domain);
  if (!base) return { ok: false, reason: 'no-domain' };
  const distUrl = `${Str.trimTrailingSlashes(base)}/dist.json`;
  const distUrlText = `${c.white(Str.trimTrailingSlashes(base))}/${c.cyan('dist.json')}`;
  const client = Http.fetcher();
  const spinner = Cli.spinner();
  spinner.start(c.italic(c.gray(`checking version ${distUrlText}`)));
  const remote = await client.json<t.DistPkg>(distUrl);
  spinner.stop();
  if (!remote.ok) return { ok: false, reason: 'remote-fetch-failed', error: remote.error };

  const remoteHash = String(remote.data?.hash?.digest ?? '').trim();
  if (!remoteHash) return { ok: false, reason: 'no-remote-hash' };

  if (localHash !== remoteHash) return { ok: false, reason: 'hash-mismatch' };
  return { ok: true, localHash, remoteHash };
}

function toHttpsUrl(input: string): string {
  const raw = String(input ?? '').trim();
  if (!raw) return '';
  if (Is.urlString(raw)) return Url.normalize(raw);
  const noScheme = Str.trimHttpScheme(raw);
  const cleaned = Str.trimLeadingSlashes(noScheme);
  return Url.normalize(`https://${cleaned}`);
}
