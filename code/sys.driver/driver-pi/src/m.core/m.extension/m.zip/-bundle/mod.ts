import { Hash } from '@sys/crypto/hash';
import { Fs } from '@sys/fs';
import { Is, Json, Path } from './common.ts';

const EXTERNAL_IMPORTS = ['node:util', 'node:zlib'] as const;
export const ZIP_POLICY_MARKER = '__ZIP_READ_POLICY__' as const;

/** Prepared standalone ZIP extension artifact. */
export type ZipReadBundleArtifact = {
  readonly bundleHash: string;
  readonly text: string;
};

/**
 * Bundle the read-only ZIP runtime and update its prepared artifact.
 */
export async function bundleZipRead(): Promise<ZipReadBundleArtifact> {
  const root = Path.resolve(import.meta.dirname ?? '.', '..');
  const source = Path.join(root, 'source/mod.read.ts');
  const built = await build(source);
  const artifact = { bundleHash: Hash.sha256(built), text: built };
  await writeIfChanged(
    Path.join(root, '-bundle/artifact.json'),
    Json.stringify(artifact, 2),
  );
  return artifact;
}

/**
 * Compute the digest for generated extension bytes.
 */
export function hashZipReadArtifact(text: string) {
  return Hash.sha256(text);
}

/**
 * Verify the generated module has one entry and only its required built-in imports.
 */
async function validateZipReadArtifact(path: string) {
  assertGraph(await denoJson(['info', '--json', '--no-config', path]));
  assertDefaultOnly(await denoJson(['doc', '--json', '--no-config', path]));
}

/**
 * Require exactly one unresolved launch-policy marker and no source-map directive.
 */
export function assertPolicyMarker(text: string) {
  if (text.split(ZIP_POLICY_MARKER).length !== 2) {
    throw new Error('ZIP read extension bundle must contain exactly one policy marker.');
  }
  if (text.includes('//# sourceMappingURL=') || text.includes('//@ sourceMappingURL=')) {
    throw new Error('ZIP read extension bundle must not contain source-map directives.');
  }
}

if (import.meta.main) await bundleZipRead();

async function build(source: string) {
  const dir = (await Fs.makeTempDir({ prefix: 'sys-driver-pi-zip-bundle-' })).absolute;
  const output = Path.join(dir, 'mod.read.ts');
  try {
    await deno([
      'bundle',
      '--frozen',
      '--platform=deno',
      ...EXTERNAL_IMPORTS.map((specifier) => `--external=${specifier}`),
      `--output=${output}`,
      source,
    ]);
    const text = await readText(output);
    assertPolicyMarker(text);
    await validateZipReadArtifact(output);
    return text;
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

function assertGraph(input: unknown) {
  if (
    !Is.record(input) || !Is.array(input.modules) || !Is.array(input.roots) ||
    input.roots.length !== 1
  ) {
    throw new Error('Deno emitted an invalid ZIP extension module graph.');
  }
  const esm = input.modules.filter((module) => Is.record(module) && module.kind === 'esm');
  if (esm.length !== 1 || !Is.record(esm[0]) || !Is.array(esm[0].dependencies)) {
    throw new Error('ZIP read extension must contain exactly one generated ESM module.');
  }
  const imports: string[] = [];
  for (const dependency of esm[0].dependencies) {
    if (
      !Is.record(dependency) || !Is.string(dependency.specifier) || dependency.isDynamic === true
    ) {
      throw new Error('ZIP read extension contains an invalid or dynamic import.');
    }
    imports.push(dependency.specifier);
  }
  if (Json.stringify(imports.sort()) !== Json.stringify([...EXTERNAL_IMPORTS].sort())) {
    throw new Error(`ZIP read extension has an invalid import graph: ${Json.stringify(imports)}`);
  }
}

function assertDefaultOnly(input: unknown) {
  if (!Is.record(input) || !Is.record(input.nodes)) {
    throw new Error('Deno emitted invalid ZIP extension documentation metadata.');
  }
  const modules = Object.values(input.nodes);
  if (modules.length !== 1 || !Is.record(modules[0]) || !Is.array(modules[0].symbols)) {
    throw new Error('ZIP read extension export metadata is invalid.');
  }
  const symbols = modules[0].symbols;
  if (
    symbols.length !== 1 || !Is.record(symbols[0]) || symbols[0].name !== 'default' ||
    symbols[0].isDefault !== true
  ) {
    throw new Error('ZIP read extension must export exactly one default extension function.');
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
