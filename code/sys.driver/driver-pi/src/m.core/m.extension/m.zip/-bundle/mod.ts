import { Hash } from '@sys/crypto/hash';
import { Fs } from '@sys/fs';
import { Is, Json, Path, type t } from './common.ts';

const EXTERNAL_IMPORTS = {
  read: ['node:util', 'node:zlib'],
  extract: [
    'node:util',
    'node:zlib',
    'node:fs',
    'node:fs/promises',
    '@earendil-works/pi-coding-agent',
  ],
} as const;
const MARKERS = { read: '__ZIP_READ_POLICY__', extract: '__ZIP_EXTRACT_POLICY__' } as const;
export const ZIP_POLICY_MARKER = MARKERS.read;
export const ZIP_EXTRACT_POLICY_MARKER = MARKERS.extract;

/**
 * Prepare both ZIP entries, or check their exact correspondence to freshly built owner source.
 * Check mode leaves prepared artifacts unchanged; both modes use the same admission rules.
 */
export async function bundleZipExtensions(mode: t.Mode = 'write'): Promise<void> {
  await bundle('read', mode);
  await bundle('extract', mode);
}

/**
 * Compute the digest for generated extension bytes.
 */
export function hashZipArtifact(text: string) {
  return Hash.sha256(text);
}

/**
 * Require one unresolved launch-policy marker and no source-map directive.
 */
export function assertPolicyMarker(text: string, kind: t.Kind = 'read') {
  if (text.split(MARKERS[kind]).length !== 2) {
    throw new Error(`ZIP ${kind} extension bundle must contain exactly one policy marker.`);
  }
  if (text.includes('//# sourceMappingURL=') || text.includes('//@ sourceMappingURL=')) {
    throw new Error(`ZIP ${kind} extension bundle must not contain source-map directives.`);
  }
}

if (import.meta.main) {
  const usage = 'Usage: deno task prep:zip [--check | --help]';
  const [arg] = Deno.args;
  if (Deno.args.length > 1 || (arg !== undefined && arg !== '--check' && arg !== '--help')) {
    throw new Error(usage);
  }
  if (arg === '--help') {
    console.info(`${usage}\n--check rebuilds and compares without updating prepared artifacts.`);
  } else {
    await bundleZipExtensions(arg === '--check' ? 'check' : 'write');
  }
}

/**
 * Helpers:
 */
async function bundle(kind: t.Kind, mode: t.Mode): Promise<t.Artifact> {
  const root = Path.resolve(import.meta.dirname ?? '.', '..');
  const source = Path.join(root, `source/mod.${kind}.ts`);
  const dir = (await Fs.makeTempDir({ prefix: 'sys-driver-pi-zip-bundle-' })).absolute;
  const output = Path.join(dir, `mod.${kind}.ts`);
  try {
    await deno([
      'bundle',
      '--frozen',
      '--platform=deno',
      ...EXTERNAL_IMPORTS[kind].map((specifier) => `--external=${specifier}`),
      `--output=${output}`,
      source,
    ]);
    const text = await readText(output);
    assertPolicyMarker(text, kind);
    // The extraction artifact's bare host import resolves through the owning module's authority.
    const config = `--config=${Path.resolve(root, '../../../../deno.json')}`;
    assertGraph(await denoJson(['info', '--json', config, output]), kind);
    assertDefaultOnly(await denoJson(['doc', '--json', config, output]));
    const artifact = { bundleHash: hashZipArtifact(text), text };
    const target = Path.join(
      root,
      '-bundle',
      kind === 'read' ? 'artifact.json' : 'artifact.extract.json',
    );
    const prepared = Json.stringify(artifact, 2);
    if (mode === 'check') {
      if (await readText(target) !== prepared) {
        throw new Error(
          `Prepared ZIP ${kind} artifact differs from current owner source: ${target}`,
        );
      }
      console.info(`ZIP ${kind} artifact matches current owner source: ${artifact.bundleHash}`);
    } else {
      await writeIfChanged(target, prepared);
    }
    return artifact;
  } finally {
    await Fs.remove(dir);
  }
}

async function deno(args: readonly string[]) {
  const output = await new Deno.Command(Deno.execPath(), {
    args: [...args],
    stdin: 'null',
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (output.success) return output;
  const stderr = new TextDecoder().decode(output.stderr).trim();
  const stdout = new TextDecoder().decode(output.stdout).trim();
  throw new Error(`ZIP artifact build failed (${args[0]}): ${stderr}\n${stdout}`);
}

async function denoJson(args: readonly string[]): Promise<unknown> {
  return Json.parse(new TextDecoder().decode((await deno(args)).stdout));
}

function assertGraph(input: unknown, kind: t.Kind) {
  if (
    !Is.record(input) || !Is.array(input.modules) || !Is.array(input.roots) ||
    input.roots.length !== 1
  ) {
    throw new Error('Deno emitted an invalid ZIP extension module graph.');
  }
  const root = input.roots[0];
  const modules = input.modules.filter((module) => Is.record(module) && module.specifier === root);
  const entry = modules[0];
  if (
    modules.length !== 1 || !Is.record(entry) || entry.kind !== 'esm' ||
    !Is.array(entry.dependencies)
  ) {
    throw new Error('ZIP extension must contain exactly one generated root ESM module.');
  }
  const imports: string[] = [];
  for (const dependency of entry.dependencies) {
    if (
      !Is.record(dependency) || !Is.string(dependency.specifier) || dependency.isDynamic === true
    ) {
      throw new Error('ZIP extension contains an invalid or dynamic import.');
    }
    imports.push(dependency.specifier);
  }
  if (Json.stringify(imports.sort()) !== Json.stringify([...EXTERNAL_IMPORTS[kind]].sort())) {
    throw new Error(
      `ZIP ${kind} extension has an invalid import graph: ${Json.stringify(imports)}`,
    );
  }
}

function assertDefaultOnly(input: unknown) {
  if (!Is.record(input) || !Is.record(input.nodes)) {
    throw new Error('Deno emitted invalid ZIP extension documentation metadata.');
  }
  const modules = Object.values(input.nodes);
  if (modules.length !== 1 || !Is.record(modules[0]) || !Is.array(modules[0].symbols)) {
    throw new Error('ZIP extension export metadata is invalid.');
  }
  const symbols = modules[0].symbols;
  if (
    symbols.length !== 1 || !Is.record(symbols[0]) || symbols[0].name !== 'default' ||
    symbols[0].isDefault !== true
  ) {
    throw new Error('ZIP extension must export exactly one default extension function.');
  }
}

async function readText(path: string): Promise<string> {
  const result = await Fs.readText(path);
  if (!result.ok || !Is.string(result.data)) {
    throw new Error(`Cannot read ZIP build input: ${path}`);
  }
  return result.data;
}

async function writeIfChanged(path: string, text: string) {
  const previous = await Fs.readText(path);
  if (previous.ok && previous.data === text) return;
  if (!previous.ok && previous.errorReason !== 'NotFound') {
    throw new Error(`Cannot inspect ZIP build target: ${path}`);
  }
  await Fs.write(path, text, { throw: true });
}
