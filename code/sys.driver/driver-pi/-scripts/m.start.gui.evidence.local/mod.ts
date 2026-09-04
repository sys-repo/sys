import { pkg } from '../../src/pkg.ts';
import { START_GUI_SERVICE } from '../../src/m.core/m.cli.profiles/u/u.start.gui.service.ts';
import { c, Fmt, Fs, FsDist, Is, Json, Pkg, Str, type t, Table } from './common.ts';

/**
 * Admitted values rendered into generated launcher evidence.
 */
export type RenderEvidenceInput = Readonly<{
  manifestUrl: t.StringUrl;
  integrity: t.StringHash;
  expectedPkg: Readonly<t.Pkg>;
}>;

/**
 * Terminal formatting options for a successful evidence binding.
 */
export type RenderEvidenceBoundOutputOptions = Readonly<{
  terminal?: boolean;
  width?: number;
}>;

type RenderEvidenceCandidate = Readonly<{
  manifestUrl: unknown;
  integrity: unknown;
  expectedPkg: unknown;
}>;

type WriteDependencies = Readonly<{
  writeTextFile: typeof Deno.writeTextFile;
}>;

const MANIFEST_URL: t.StringUrl = 'http://localhost:8080/dist.json';
const PACKAGE_ROOT = Fs.resolve(import.meta.dirname ?? '.', '../..');
const DIST_DIR = Fs.join(PACKAGE_ROOT, 'dist');

/**
 * Fixed local-rehearsal evidence metadata.
 */
export const EVIDENCE = Object.freeze({
  packageName: pkg.name,
  kind: 'LOCAL GUI (rehearsal)',
  state: 'bound',
  outputPath: 'src/m.core/m.cli.profiles/u/u.start.gui.service.evidence.ts',
  commitMessage: 'chore(driver-pi): bind rebuilt local GUI evidence',
});

const OUTPUT_PATH = Fs.join(PACKAGE_ROOT, EVIDENCE.outputPath);
const OUTPUT_WRITE_FAILURE = 'Driver Pi local GUI evidence output write failed.';
const INVALID_MANIFEST_URL = 'Driver Pi local GUI evidence manifest URL is invalid.';
const INVALID_INTEGRITY = 'Driver Pi local GUI evidence integrity is invalid.';
const INVALID_PACKAGE = 'Driver Pi local GUI evidence package identity is invalid.';

const DEFAULT_WRITE_DEPENDENCIES: WriteDependencies = Object.freeze({
  writeTextFile: Deno.writeTextFile,
});

/**
 * Verify one saved local candidate before binding it as launcher-owned evidence.
 */
export async function main(): Promise<void> {
  const verified = await FsDist.Local.verify({
    dir: DIST_DIR,
    limits: START_GUI_SERVICE.limits,
  });
  if (verified.kind !== 'verified') {
    throw new Error(`Driver Pi local GUI Dist verification failed: ${verified.kind}.`);
  }

  const observed = verified.evidence.dist.pkg;
  if (!observed || observed.name !== pkg.name || observed.version !== pkg.version) {
    throw new Error(
      `Driver Pi local GUI Dist package mismatch: expected ${pkg.name}@${pkg.version}.`,
    );
  }

  const evidence = {
    manifestUrl: MANIFEST_URL,
    integrity: verified.evidence.integrity,
    expectedPkg: pkg,
  };
  const source = renderEvidence(evidence);
  const output = renderEvidenceBoundOutput(evidence);
  await writeEvidenceWith(source, DEFAULT_WRITE_DEPENDENCIES);

  console.info();
  console.info(output);
  console.info();
}

/**
 * Render the successful binding result and its data-only commit suggestion.
 */
export function renderEvidenceBoundOutput(
  input: RenderEvidenceInput,
  options: RenderEvidenceBoundOutputOptions = {},
): string {
  const labels = ['package', 'evidence', 'state', 'output'] as const;
  const reserve = Fmt.Text.Width.max([...labels]) + Table.cellGap;
  const contentWidth = Fmt.Text.Width.fit({
    width: options.width,
    reserve,
    terminal: options.terminal,
  });
  const outputPath = Fmt.Path.tty(EVIDENCE.outputPath, {
    min: 1,
    relative: 'bare',
    reserve,
    terminal: options.terminal,
    width: options.width,
  });
  const detailLabels = ['manifest', 'integrity', 'expects'] as const;
  const detailValues = [
    [input.manifestUrl, c.cyan],
    [input.integrity, c.cyan],
    [Pkg.toString(input.expectedPkg), c.white],
  ] as const;
  const detailLabelWidth = Fmt.Text.Width.max([...detailLabels]);
  const detailRows = detailLabels.map((label, index) => {
    const [value, color] = detailValues[index];
    const branch = c.gray(Fmt.Tree.branch([index, detailLabels]));
    const detailLabel = c.gray(Fmt.Text.Width.padEnd(label, detailLabelWidth));
    const prefix = `${branch} ${detailLabel}${' '.repeat(Table.cellGap)}`;
    const valueWidth = Fmt.Text.Width.fit({
      width: contentWidth,
      reserve: Fmt.Text.Width.measure(prefix),
      terminal: false,
    });
    return `${prefix}${formatDetail(value, valueWidth, color)}`;
  });
  const output = [outputPath, ...detailRows].join('\n');

  const table = Table.create();
  table.push([c.gray(labels[0]), c.white(EVIDENCE.packageName)]);
  table.push([c.gray(labels[1]), c.magenta(EVIDENCE.kind)]);
  table.push([c.gray(labels[2]), c.green(EVIDENCE.state)]);
  table.push([c.gray(labels[3]), output]);

  const tableText = String(table).split('\n').map((line) => line.trimEnd()).join('\n');
  const rule = options.width === undefined
    ? Fmt.hr('cyan')
    : Fmt.hr({ width: options.width, color: 'cyan' });
  return Str.dedent(`${tableText}

${rule}
${Fmt.Commit.suggestion(EVIDENCE.commitMessage)}`);
}

/**
 * Admit one local-rehearsal tuple and render deterministic TypeScript source.
 */
export function renderEvidence(input: RenderEvidenceCandidate): string {
  const manifestUrl = admitManifestUrl(input.manifestUrl);
  const integrity = admitIntegrity(input.integrity);
  const expectedPkg = admitPackage(input.expectedPkg);
  const source = Str.dedent(`
    // AUTO-GENERATED by \`deno task bind:gui:evidence:local\`.
    // DO NOT EDIT MANUALLY.
    // Checked in so \`start:gui\` can authenticate one frozen local-rehearsal build.
    // This is not published release evidence.

    export const START_GUI_RELEASE_EVIDENCE = Object.freeze({
      kind: 'release' as const,
      manifestUrl: ${tsString(manifestUrl)},
      integrity: ${tsString(integrity)},
      expectedPkg: Object.freeze({
        name: ${tsString(expectedPkg.name)},
        version: ${tsString(expectedPkg.version)},
      }),
    });
  `);

  // Generated TypeScript ends with exactly one newline.
  return `${source}\n`;
}

/**
 * Internal output seam that never reports successful generation after a failed write.
 */
export async function writeEvidenceWith(
  source: string,
  deps: WriteDependencies,
): Promise<void> {
  try {
    await deps.writeTextFile(OUTPUT_PATH, source);
  } catch (cause) {
    throw new Error(OUTPUT_WRITE_FAILURE, { cause });
  }
}

/**
 * Helpers:
 */
function formatDetail(value: string, width: number, color: (text: string) => string): string {
  if (Fmt.Text.Width.measure(value) <= width) return color(value);
  return Fmt.Text.ellipsize(value, width, {
    render({ head, ellipsis, tail }) {
      return `${color(head)}${Fmt.omission(ellipsis)}${color(tail)}`;
    },
  });
}

function admitManifestUrl(input: unknown): t.StringUrl {
  if (
    !Is.string(input) || input.length === 0 ||
    input.length > START_GUI_SERVICE.authorityLimits.manifestUrl
  ) {
    throw new Error(INVALID_MANIFEST_URL);
  }
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error(INVALID_MANIFEST_URL);
  }
  if (
    url.href !== input || (url.protocol !== 'http:' && url.protocol !== 'https:') ||
    url.username || url.password || url.search || url.hash
  ) {
    throw new Error(INVALID_MANIFEST_URL);
  }
  return input;
}

function admitIntegrity(input: unknown): t.StringHash {
  const parsed = FsDist.Part.parse(input);
  if (!parsed || parsed.hash !== input || parsed.size !== undefined) {
    throw new Error(INVALID_INTEGRITY);
  }
  return input;
}

function admitPackage(input: unknown): Readonly<t.Pkg> {
  if (!Is.plainObject(input)) throw new Error(INVALID_PACKAGE);
  const { name, version } = input;
  if (
    !isBoundedIdentity(name, START_GUI_SERVICE.authorityLimits.packageName) ||
    !isBoundedIdentity(version, START_GUI_SERVICE.authorityLimits.packageVersion)
  ) {
    throw new Error(INVALID_PACKAGE);
  }
  return Object.freeze({ name, version });
}

function isBoundedIdentity(input: unknown, max: number): input is string {
  if (!Is.string(input) || input.length === 0 || input.length > max) return false;
  // Identity admission must inspect each UTF-16 code unit for control characters.
  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    if (code <= 0x1f || code === 0x7f) return false;
  }
  return true;
}

function tsString(input: string): string {
  const encoded = Json.stringify(input);
  const body = Str.replaceAll(encoded.slice(1, -1), "'", "\\'").after;
  return `'${body}'`;
}
