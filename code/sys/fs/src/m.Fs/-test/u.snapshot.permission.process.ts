import { Fs } from '../mod.ts';

const [mode, root, path] = Deno.args;
if (!(mode === 'allowed' || mode === 'denied') || !root || !path) {
  throw new Error('Invalid snapshot permission fixture arguments.');
}

if (mode === 'denied') {
  try {
    await Fs.Snapshot.file({ root, path, maxBytes: 4, timeout: 10_000 });
    throw new Error('Snapshot unexpectedly succeeded without read authority.');
  } catch (cause) {
    if (!Fs.Snapshot.Is.failure(cause) || cause.kind !== 'permission-denied') throw cause;
    console.log(JSON.stringify({ failure: cause.kind }));
  }
} else {
  let ancestorDenied = false;
  try {
    await Deno.lstat(Fs.dirname(root));
  } catch (cause) {
    ancestorDenied = cause instanceof Deno.errors.NotCapable ||
      cause instanceof Deno.errors.PermissionDenied;
  }
  if (!ancestorDenied) throw new Error('Ancestor read authority was not denied.');

  const result = await Fs.Snapshot.file({ root, path, maxBytes: 4, timeout: 10_000 });
  console.log(
    JSON.stringify({
      ancestorDenied,
      path: result.path,
      byteLength: result.byteLength,
      evidence: result.evidence,
      bytes: [...result.bytes],
    }),
  );
}
