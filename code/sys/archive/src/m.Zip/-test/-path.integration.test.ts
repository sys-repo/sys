import { Fs } from '@sys/fs';
import type { FsRooted } from '@sys/fs/t';
import { describe, expect, it, type t } from '../../-test.ts';
import { Zip } from '../mod.ts';
import { zip } from './u.fixture.ts';

const LIMITS: t.Zip.Limits = Object.freeze({
  maxSourceBytes: 2 * 1024 * 1024,
  maxEntries: 2048,
  maxTreeEntries: 8192,
  maxPathBytes: 512,
  maxPathDepth: 32,
  maxEntryBytes: 1024 * 1024,
  maxExpandedBytes: 2 * 1024 * 1024,
  maxErrorChars: 1000,
});

describe('@sys/archive/zip: Rooted path compatibility', () => {
  it('maps every generated ZIP entry to an identical Rooted target', async () => {
    const root = await Deno.makeTempDir({ prefix: 'sys-archive-zip-' });
    try {
      const rooted = await Fs.Capability.Rooted.create({ root, create: false });
      const names = generatedNames();
      const archive = await Zip.open(
        zip(names.map((name) => ({ name, utf8: !isAscii(name) }))).bytes,
        { limits: LIMITS, timeout: 10_000 },
      );
      const targets = archive.inspect().entries.map((entry) => ({
        kind: entry.kind,
        path: entry.kind === 'directory' ? entry.path.slice(0, -1) : entry.path,
      }));
      const admission = await rooted.Target.admit(targets);
      expect(admission.targets.map((target) => ({ kind: target.kind, path: target.path }))).to.eql(
        targets,
      );
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  });

  it('never admits a mutation-corpus path that Rooted rejects', async () => {
    const root = await Deno.makeTempDir({ prefix: 'sys-archive-zip-mutations-' });
    try {
      const rooted = await Fs.Capability.Rooted.create({ root, create: false });
      let zipAccepted = 0;
      let zipRejected = 0;
      let rootedRejected = 0;

      for (const name of mutationNames()) {
        const zipResult = await zipAdmits(name);
        const rootedResult = await rootedAdmits(rooted, name);
        if (zipResult) zipAccepted++;
        else zipRejected++;
        if (!rootedResult) rootedRejected++;
        if (zipResult && !rootedResult) {
          throw new Error(`ZIP admitted a path refused by Rooted: ${JSON.stringify(name)}`);
        }
      }

      expect(zipAccepted).to.be.greaterThan(5);
      expect(zipRejected).to.be.greaterThan(20);
      expect(rootedRejected).to.be.greaterThan(20);
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  });
});

async function zipAdmits(name: string): Promise<boolean> {
  try {
    await Zip.open(zip([{ name, utf8: !isAscii(name) }]).bytes, {
      limits: LIMITS,
      timeout: 10_000,
    });
    return true;
  } catch (error) {
    if (!Zip.Is.failure(error)) throw error;
    return false;
  }
}

async function rootedAdmits(rooted: FsRooted.Instance, name: string): Promise<boolean> {
  const directory = name.endsWith('/');
  try {
    await rooted.Target.admit([{
      kind: directory ? 'directory' : 'file',
      path: directory ? name.slice(0, -1) : name,
    }]);
    return true;
  } catch (error) {
    if (!Fs.Capability.Rooted.Is.failure(error)) throw error;
    return false;
  }
}

function mutationNames(): string[] {
  const names = new Set([
    'plain.txt',
    'folder/',
    'folder/file.txt',
    '.hidden',
    'café/data.json',
    'emoji-😀.txt',
    '',
    '/',
    '/absolute',
    '\\absolute',
    '../escape',
    'a/../escape',
    'a/./value',
    'a//value',
    'a\\value',
    'C:drive',
    'CON',
    'con.txt',
    'CLOCK$.log',
    'COM¹.bin',
    'LPT³',
    '.sys.rooted',
    '.SYS.ROOTED-stage',
    'trailing.',
    'trailing ',
    'colon:name',
    'question?',
    'line\nfeed',
    'escape\u001bcode',
    'format\u200dmark',
    'separator\u2028mark',
    'e\u0301.txt',
  ]);
  for (const seed of ['alpha', 'Nested/Value', 'café']) {
    names.add(seed);
    names.add(`${seed}.`);
    names.add(`${seed} `);
    names.add(`/${seed}`);
    names.add(`${seed}/../escape`);
    names.add(`${seed}\\child`);
  }
  return [...names];
}

function generatedNames(): string[] {
  const output = ['folder/', 'folder/file.txt', '.hidden', 'café/data.json'];
  const atoms = ['alpha', 'Beta-2', 'under_score', 'space value', 'éclair'];
  for (let index = 0; index < 96; index++) {
    const first = atoms[index % atoms.length];
    const second = `part-${index}`;
    output.push(`${first}/${second}/value-${index}.bin`);
  }
  return output;
}

function isAscii(input: string): boolean {
  for (let index = 0; index < input.length; index++) {
    if (input.charCodeAt(index) > 0x7f) return false;
  }
  return true;
}
