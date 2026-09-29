import { pkg } from '../../src/pkg.ts';
import {
  AUTHORITY_LIMITS,
  VERIFY_LIMITS,
} from '../../src/m.cli/m.profiles/u.start/u.gui/u.policy.ts';
import {
  readGuiPackage,
  snapshotGuiPackage,
} from '../../src/m.cli/m.profiles/u.start/u.gui/u.pkg.ts';
import { c, Fmt, Fs, FsDist, Is, Json, Pkg, Str, type t, Table } from './common.ts';

/**
 * Admitted values rendered into generated launcher evidence.
 */
export type RenderEvidenceInput = Readonly<{
  manifestUrl: t.StringUrl;
  pin: t.DistPin;
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
  pin: unknown;
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
  outputPath: 'src/m.cli/m.profiles/u.start/u.gui/u.service.evidence.ts',
  commitMessage: 'chore(driver-pi): bind rebuilt local GUI evidence',
});

const OUTPUT_PATH = Fs.join(PACKAGE_ROOT, EVIDENCE.outputPath);
const OUTPUT_WRITE_FAILURE = 'Driver Pi local GUI evidence output write failed.';
const INVALID_MANIFEST_URL = 'Driver Pi local GUI evidence manifest URL is invalid.';
const INVALID_PIN = 'Driver Pi local GUI evidence content pin is invalid.';
const INVALID_PACKAGE = 'Driver Pi local GUI evidence package identity is invalid.';

const DEFAULT_WRITE_DEPENDENCIES: WriteDependencies = Object.freeze({
  writeTextFile: Deno.writeTextFile,
});

/**
 * Verify one saved local candidate before binding it as launcher-owned evidence.
 */
export function main(): Promise<void> {
  return bindEvidenceWith(DIST_DIR, {
    write: (source) => writeEvidenceWith(source, DEFAULT_WRITE_DEPENDENCIES),
    print: console.info,
  });
}

/** Internal candidate/output seam; verification and package expectations remain owner-selected. */
export async function bindEvidenceWith(
  dir: t.StringDir,
  output: Readonly<{
    write: (source: string) => Promise<void>;
    print: (...data: unknown[]) => void;
  }>,
): Promise<void> {
  const verified = await FsDist.Local.verify({
    dir,
    limits: VERIFY_LIMITS,
  });
  if (verified.kind !== 'verified') {
    throw new Error(`Driver Pi local GUI Dist verification failed: ${verified.kind}.`);
  }

  const observed = await readGuiPackage(
    await Fs.realPath(dir),
    verified.evidence.content,
    undefined,
    FsDist.Local.readPart,
  );
  if (!observed || observed.name !== pkg.name || observed.version !== pkg.version) {
    throw new Error(
      `Driver Pi local GUI Dist package mismatch: expected ${pkg.name}@${pkg.version}.`,
    );
  }

  const evidence = {
    manifestUrl: MANIFEST_URL,
    pin: Object.freeze({
      scheme: verified.evidence.content.scheme,
      digest: verified.evidence.content.digest,
    }),
    expectedPkg: pkg,
  };
  const source = renderEvidence(evidence);
  const text = renderEvidenceBoundOutput(evidence);
  await output.write(source);

  output.print();
  output.print(text);
  output.print();
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
  const detailLabels = ['manifest', 'scheme', 'digest', 'expects'] as const;
  const detailValues = [
    [input.manifestUrl, c.cyan],
    [input.pin.scheme, c.cyan],
    [input.pin.digest, c.cyan],
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
  const pin = admitPin(input.pin);
  const expectedPkg = admitPackage(input.expectedPkg);
  const source = Str.dedent(`
    // AUTO-GENERATED by \`deno task bind:gui:evidence:local\`.
    // DO NOT EDIT MANUALLY.
    // Checked in so \`start:gui\` can verify a local build against the recorded content pin.
    // This is not published release evidence.

    export const START_GUI_RELEASE_EVIDENCE = Object.freeze({
      kind: 'release' as const,
      manifestUrl: ${tsString(manifestUrl)},
      pin: Object.freeze({
        scheme: ${tsString(pin.scheme)},
        digest: ${tsString(pin.digest)},
      }),
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
    input.length > AUTHORITY_LIMITS.manifestUrl
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

function admitPin(input: unknown): t.DistPin {
  if (!Pkg.Is.distPin(input)) throw new Error(INVALID_PIN);
  return Object.freeze({ scheme: input.scheme, digest: input.digest });
}

function admitPackage(input: unknown): Readonly<t.Pkg> {
  const pkg = snapshotGuiPackage(input);
  if (!pkg) throw new Error(INVALID_PACKAGE);
  return pkg;
}

function tsString(input: string): string {
  const encoded = Json.stringify(input);
  const body = Str.replaceAll(encoded.slice(1, -1), "'", "\\'").after;
  return `'${body}'`;
}
