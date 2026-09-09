import type { ToolDefinition } from '@earendil-works/pi-coding-agent';
import { Is, Path } from '../../src/m.core/m.extension/m.zip/common.ts';
import { context } from '../../src/m.core/m.extension/m.zip/-test/u.fixture.context.ts';
import { registerZipExtract } from '../../src/m.core/m.extension/m.zip/source/u.extract.ts';
import { resolvePolicy } from '../../src/m.core/m.extension/m.zip/u/u.policy.ts';

if (import.meta.main) await main();

async function main() {
  const [source, destination] = Deno.args;
  if (Deno.args.length !== 2 || !source || !destination) {
    throw new Error('Expected exact fixture roots.');
  }
  for (const name of ['run', 'net', 'ffi', 'env', 'sys'] as const) {
    if ((await Deno.permissions.query({ name })).state !== 'denied') {
      throw new Error(`${name} must be denied.`);
    }
  }
  if (
    (await Deno.permissions.query({ name: 'read', path: Path.dirname(source) })).state === 'granted'
  ) {
    throw new Error('Ancestor read authority was unexpectedly granted.');
  }
  if ((await Deno.permissions.query({ name: 'write', path: source })).state !== 'denied') {
    throw new Error('Source write authority must be denied.');
  }
  const policy = await resolvePolicy({
    enabled: true,
    extract: 'cooperative',
    readRoots: [source],
    writeRoots: [destination],
    protectedRoots: [],
  });
  const tools: Pick<ToolDefinition, 'execute'>[] = [];
  // This proves the runtime's permission footprint, not the upstream queue or its loader ABI.
  registerZipExtract(
    {
      registerTool(tool) {
        tools.push(tool);
      },
    },
    policy,
    (_key, run) => run(),
  );
  const result = await tools[0].execute(
    'narrow',
    {
      path: Path.join(source, 'a.zip'),
      to: Path.join(destination, 'unpacked'),
    },
    undefined,
    undefined,
    context(destination),
  );
  if (
    !Is.record(result.details) || result.details.publication !== 'published' ||
    result.details.cleanup !== 'complete'
  ) {
    throw new Error('Narrow extraction did not report complete publication and cleanup.');
  }
  if (await Deno.readTextFile(Path.join(destination, 'unpacked/a.txt')) !== 'hello') {
    throw new Error('Narrow extraction bytes differ.');
  }
  console.log('ZIP_NARROW_OK');
}
