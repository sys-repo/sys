import { Json, Num, StdPath } from '../common.ts';
import { Pkg } from '../../m.Pkg/mod.ts';

const [dir, path, checksum, sizeText] = Deno.args;
const size = Number(sizeText);
if (!dir || !path || !checksum || !Num.Is.safeInt(size) || size < 0) {
  throw new Error('Expected one exact local Dist file claim.');
}

const root = StdPath.resolve(dir);
let ancestorDenied = false;
try {
  await Deno.lstat(StdPath.dirname(root));
} catch (cause) {
  if (!(cause instanceof Deno.errors.NotCapable)) {
    throw new Error('Unexpected ancestor-read failure.', { cause });
  }
  ancestorDenied = true;
}
if (!ancestorDenied) throw new Error('Ancestor read was not denied.');

const limits = Object.freeze({
  manifestBytes: 1024 * 1024,
  entries: 100,
  fileBytes: 1024 * 1024,
  totalBytes: 4 * 1024 * 1024,
});
const verified = await Pkg.Dist.Local.verify({ dir, limits });
if (verified.kind !== 'verified') {
  throw new Error(`Local verification failed: ${verified.kind}.`);
}

const read = await Pkg.Dist.Local.readPart({ dir, path, checksum, size });
if (read.kind !== 'read') throw new Error(`Local part read failed: ${read.kind}.`);

console.info(Json.stringify({
  ancestorDenied,
  verification: verified.kind,
  read: read.kind,
  bytes: read.bytes.byteLength,
}));
