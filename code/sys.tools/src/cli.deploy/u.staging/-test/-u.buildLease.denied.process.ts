import { Err, Json, Path } from '../common.ts';
import { acquireStagingBuildLease } from '../u.buildLease.ts';
import { captureDirectoryIdentity } from '../u.identity.ts';

const [source] = Deno.args;
if (!source) throw new Error('Expected a build source.');

// Pin the child authority: dependency initialization must not need environment or write grants.
for (const name of ['write', 'env', 'net', 'run', 'sys', 'ffi'] as const) {
  const permission = await Deno.permissions.query({ name });
  if (permission.state === 'granted') throw new Error(`Unexpected ${name} authority.`);
}

try {
  const sourceIdentity = await captureDirectoryIdentity({ path: source, label: 'Build source' });
  const lease = await acquireStagingBuildLease({
    mappings: [{
      mode: 'build+copy',
      source: sourceIdentity.path,
      sourceIdentity,
      staging: Path.resolve(source, '../../endpoint/stage'),
    }],
    signal: new AbortController().signal,
  });
  await lease?.release();
  console.info(Json.stringify({ ok: true }));
} catch (error) {
  console.info(Json.stringify({
    ok: false,
    error: Err.summary(error, { cause: true, stack: false }),
  }));
}
