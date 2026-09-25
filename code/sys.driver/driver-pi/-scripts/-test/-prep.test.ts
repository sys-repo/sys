import { DenoDeps } from '@sys/driver-deno/runtime';
import type { DenoDepsLib } from '../-prep.u.ts';
import { describe, expect, expectError, Fs, it, Str } from '../common.ts';
import {
  PI_AGENT_IMPORT,
  PI_AGENT_IMPORT_BASE,
  resolvePkg,
} from '../../src/m.cli/u/u.resolve.pkg.ts';
import { PATH, pinPiAgentImport, resolvePiAgentImport, syncPiAgentImport } from '../-prep.u.ts';
import { parseArgs } from '../task.prep.deps.ts';

const NEXT_VERSION = '9.8.7';
const NEXT_SPEC = `${PI_AGENT_IMPORT_BASE}@${NEXT_VERSION}`;
const BASE_LINE = `export const PI_AGENT_IMPORT_BASE = '${PI_AGENT_IMPORT_BASE}' as const;`;
const IMPORT_LINE =
  'export const PI_AGENT_IMPORT = `${PI_AGENT_IMPORT_BASE}@${PI_AGENT_IMPORT_VERSION}` as const;';

describe('driver-pi/scripts/-prep', () => {
  it('metadata arguments → accepts only no arguments or one literal --check', () => {
    expect(parseArgs([])).to.eql({ check: false });
    expect(parseArgs(['--check'])).to.eql({ check: true });
    for (
      const argv of [
        ['--check', '--check'],
        ['--check=true'],
        ['--check=false'],
        ['--check', 'true'],
        ['--help'],
        ['-h'],
        ['-c'],
        ['--unknown'],
        ['--'],
        ['--', '--check'],
        ['--check', '--'],
        ['deps.yaml'],
        [''],
      ]
    ) {
      expect(() => parseArgs(argv)).to.throw('Expected no arguments or --check');
    }
  });

  it('repository fallback → current canonical dependency, without a second authored pin', async () => {
    const root = Fs.resolve(import.meta.dirname ?? '.', '../../../../..');
    const specifier = await resolvePiAgentImport(PATH.fromRoot(root).rootDepsYaml, DenoDeps);
    expect(PI_AGENT_IMPORT).to.eql(specifier);
    const imports = await Fs.readJson<{ imports: Record<string, string> }>(
      Fs.join(root, 'imports.json'),
    );
    expect(imports.data?.imports[PI_AGENT_IMPORT_BASE.slice('npm:'.length)]).to.eql(specifier);
  });

  it('dependency update → refreshed fallback; check refuses drift without rewriting', async () => {
    const root = (await Fs.makeTempDir({ prefix: 'pi.deps.' })).absolute;
    const path = PATH.fromRoot(root);
    try {
      await Fs.write(path.resolvePkgFile, resolverSource(), { throw: true });
      for (const version of ['9.8.7', '10.0.0', '11.0.0-rc.1']) {
        const specifier = `${PI_AGENT_IMPORT_BASE}@${version}`;
        await Fs.write(
          path.rootDepsYaml,
          Str.dedent(`
            deno.json:
              - import: ${specifier}
          `),
          { throw: true },
        );
        const before = (await Fs.readText(path.resolvePkgFile)).data;
        await expectError(
          () => syncPiAgentImport(path, { check: true }),
          'Stale Pi dependency metadata:',
        );
        expect((await Fs.readText(path.resolvePkgFile)).data).to.eql(before);
        expect(await syncPiAgentImport(path)).to.eql({
          changed: true,
          specifier,
          path: path.resolvePkgFile,
        });
        expect((await Fs.readText(path.resolvePkgFile)).data).to.eql(resolverSource(version));
        expect(await syncPiAgentImport(path, { check: true })).to.eql({
          changed: false,
          specifier,
          path: path.resolvePkgFile,
        });
        expect((await syncPiAgentImport(path)).changed).to.eql(false);
        expect(await resolvePkg({ cwd: root })).to.eql(specifier);
      }
      expect(await resolvePkg({ cwd: root, pkg: 'npm:explicit-host@1.0.0' })).to.eql(
        'npm:explicit-host@1.0.0',
      );
    } finally {
      await Fs.remove(root);
    }
  });

  it('missing or invalid authority → preserves the existing fallback', async () => {
    const root = (await Fs.makeTempDir({ prefix: 'pi.deps.invalid.' })).absolute;
    const path = PATH.fromRoot(root);
    try {
      await Fs.write(path.resolvePkgFile, resolverSource(), { throw: true });
      await expectError(() => syncPiAgentImport(path));
      expect((await Fs.readText(path.resolvePkgFile)).data).to.eql(resolverSource());
      for (
        const text of [
          'deno.json: [',
          'deno.json: []',
          `deno.json: [{ import: ${PI_AGENT_IMPORT_BASE}@latest }]`,
          // The workspace import grammar deliberately excludes build metadata.
          `deno.json: [{ import: ${PI_AGENT_IMPORT_BASE}@11.0.0+build.42 }]`,
        ]
      ) {
        await Fs.write(path.rootDepsYaml, text, { throw: true });
        await expectError(() => syncPiAgentImport(path));
        expect((await Fs.readText(path.resolvePkgFile)).data).to.eql(resolverSource());
      }
    } finally {
      await Fs.remove(root);
    }
  });

  it('missing or malformed source → rejects without creating or rewriting the fallback', async () => {
    const root = (await Fs.makeTempDir({ prefix: 'pi.deps.source.' })).absolute;
    const path = PATH.fromRoot(root);
    try {
      await Fs.write(
        path.rootDepsYaml,
        Str.dedent(`
          deno.json:
            - import: ${NEXT_SPEC}
        `),
        { throw: true },
      );
      await expectError(() => syncPiAgentImport(path), 'Failed to read Pi dependency metadata:');
      expect(await Fs.exists(path.resolvePkgFile)).to.eql(false);

      const source = resolverSource().replace(IMPORT_LINE, '// missing import expression');
      await Fs.write(path.resolvePkgFile, source, { throw: true });
      await expectError(
        () => syncPiAgentImport(path),
        'Could not locate PI_AGENT_IMPORT expression',
      );
      expect((await Fs.readText(path.resolvePkgFile)).data).to.eql(source);
    } finally {
      await Fs.remove(root);
    }
  });

  it('updates only the generated fallback version, preserving LF or CRLF bytes', () => {
    for (const newline of ['\n', '\r\n']) {
      const source = resolverSource('1.2.3').replaceAll('\n', newline);
      const expected = resolverSource(NEXT_VERSION).replaceAll('\n', newline);
      expect(pinPiAgentImport(source, NEXT_SPEC)).to.eql(expected);
    }
  });

  it('pinPiAgentImport is idempotent when already pinned to target version', () => {
    const source = resolverSource(NEXT_VERSION);
    const res = pinPiAgentImport(source, NEXT_SPEC);
    expect(res).to.eql(source);
  });

  it('resolvePiAgentImport reads the package spec from deps authority', async () => {
    const stub: DenoDepsLib = {
      from(source) {
        expect(source).to.eql('/tmp/deps.yaml');
        return Promise.resolve({
          error: undefined,
          data: { deps: [{ import: NEXT_SPEC }] },
        });
      },
      findImport(_deps, input) {
        expect(input).to.eql(PI_AGENT_IMPORT_BASE);
        return NEXT_SPEC;
      },
    };

    const version = await resolvePiAgentImport('/tmp/deps.yaml', stub);
    expect(version).to.eql(NEXT_SPEC);
  });

  it('resolvePiAgentImport throws when deps authority is missing the package', async () => {
    const stub: DenoDepsLib = {
      from() {
        return Promise.resolve({
          error: undefined,
          data: { deps: [{ import: 'npm:other@1.0.0' }] },
        });
      },
      findImport() {
        return undefined;
      },
    };

    await expectError(
      () => resolvePiAgentImport('/tmp/deps.yaml', stub),
      `Missing deps import for package "${PI_AGENT_IMPORT_BASE}": /tmp/deps.yaml`,
    );
  });

  it('rejects tags, ranges, partial versions, foreign packages, and source injection', () => {
    for (
      const specifier of [
        PI_AGENT_IMPORT_BASE,
        `${PI_AGENT_IMPORT_BASE}@`,
        `${PI_AGENT_IMPORT_BASE}@latest`,
        `${PI_AGENT_IMPORT_BASE}@^1.2.3`,
        `${PI_AGENT_IMPORT_BASE}@~1.2.3`,
        `${PI_AGENT_IMPORT_BASE}@1.2`,
        `${PI_AGENT_IMPORT_BASE}@v1.2.3`,
        `${PI_AGENT_IMPORT_BASE}@1.2.3'; throw new Error('injected')`,
        'npm:other@1.2.3',
      ]
    ) {
      expect(() => pinPiAgentImport(resolverSource(), specifier)).to.throw(
        `Expected pinned Pi coding agent npm specifier: ${specifier}`,
      );
    }
  });

  it('duplicate generated seams → refuses an ambiguous rewrite', () => {
    const source = Str.dedent(`
      const PI_AGENT_IMPORT_VERSION = '1.2.3' as const;
      const PI_AGENT_IMPORT_VERSION = '4.5.6' as const;
      ${BASE_LINE}
      ${IMPORT_LINE}
    `);
    expect(() => pinPiAgentImport(source, NEXT_SPEC)).to.throw(
      'Expected exactly one PI_AGENT_IMPORT_VERSION in m.cli/u/u.resolve.pkg.ts',
    );
  });

  it('pinPiAgentImport throws when the base seam is missing', () => {
    expect(() => pinPiAgentImport(resolverSource().replace(BASE_LINE, ''), NEXT_SPEC)).to.throw(
      'Could not locate PI_AGENT_IMPORT_BASE in m.cli/u/u.resolve.pkg.ts',
    );
  });

  it('pinPiAgentImport throws when the version seam is missing', () => {
    expect(() =>
      pinPiAgentImport(
        resolverSource().replace("const PI_AGENT_IMPORT_VERSION = '1.2.3' as const;", ''),
        NEXT_SPEC,
      )
    ).to.throw(
      'Expected exactly one PI_AGENT_IMPORT_VERSION in m.cli/u/u.resolve.pkg.ts',
    );
  });

  it('pinPiAgentImport throws when the import expression is missing', () => {
    expect(() => pinPiAgentImport(resolverSource().replace(IMPORT_LINE, ''), NEXT_SPEC)).to.throw(
      'Could not locate PI_AGENT_IMPORT expression in m.cli/u/u.resolve.pkg.ts',
    );
  });
});

/** Fixture versions are deliberately independent of the selected dependency. */
function resolverSource(version = '1.2.3') {
  return Str.dedent(`
    // Source before the generated seam stays unchanged.
    const PI_AGENT_IMPORT_VERSION = '${version}' as const;
    ${BASE_LINE}
    ${IMPORT_LINE}
    export const unrelated = 'preserve me';
  `);
}
