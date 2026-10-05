import { Fs } from '../m.start.gui.evidence.local/common.ts';
import { bindEvidenceWith } from '../m.start.gui.evidence.local/mod.ts';

const [dir, output] = Deno.args;
if (!dir || !output || Deno.args.length !== 2) {
  throw new Error('Expected disposable fixture paths.');
}

for (
  const descriptor of [
    { name: 'read', path: dir },
    { name: 'write', path: output },
  ] satisfies Deno.PermissionDescriptor[]
) {
  if ((await Deno.permissions.query(descriptor)).state !== 'granted') {
    throw new Error(`Expected fixture ${descriptor.name} authority.`);
  }
}
for (
  const descriptor of [
    { name: 'read', path: Fs.dirname(dir) },
    { name: 'read', path: Fs.resolve(dir, '/') },
    { name: 'write', path: Fs.dirname(output) },
    { name: 'env', variable: 'HOME' },
    { name: 'env', variable: 'TF_BUILD' },
    { name: 'env', variable: 'AGENT_NAME' },
    { name: 'net', host: '127.0.0.1' },
    { name: 'run', command: Deno.execPath() },
    { name: 'sys', kind: 'hostname' },
    { name: 'ffi', path: Deno.execPath() },
  ] satisfies Deno.PermissionDescriptor[]
) {
  if ((await Deno.permissions.query(descriptor)).state === 'granted') {
    throw new Error(`Unexpected ambient ${descriptor.name} authority.`);
  }
}

// --no-prompt makes every ungranted ancestor/ambient operation unavailable.
await bindEvidenceWith(dir, {
  write: (source) => Deno.writeTextFile(output, source),
  print: console.info,
});
