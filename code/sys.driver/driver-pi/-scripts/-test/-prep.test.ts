import { describe, expect, it } from '../../src/-test.ts';
import { PI_AGENT_IMPORT_BASE } from '../../src/m.core/m.cli/u.resolve.pkg.ts';
import { type DenoDepsLib, pinPiAgentImport, resolvePiAgentImport } from '../-prep.u.ts';

const NEXT_VERSION = '9.8.7';
const NEXT_SPEC = `${PI_AGENT_IMPORT_BASE}@${NEXT_VERSION}`;
const BASE_LINE = `export const PI_AGENT_IMPORT_BASE = '${PI_AGENT_IMPORT_BASE}' as const;`;
const IMPORT_LINE =
  'export const PI_AGENT_IMPORT = `${PI_AGENT_IMPORT_BASE}@${PI_AGENT_IMPORT_VERSION}` as const;';

function resolverSource(version = '1.2.3') {
  return `
const PI_AGENT_IMPORT_VERSION = '${version}' as const;
${BASE_LINE}
${IMPORT_LINE}
`;
}

describe('driver-pi/scripts/-prep', () => {
  it('updates only the generated fallback version', () => {
    const res = pinPiAgentImport(resolverSource('1.2.3'), NEXT_SPEC);
    expect(res).to.eql(resolverSource(NEXT_VERSION));
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

    try {
      await resolvePiAgentImport('/tmp/deps.yaml', stub);
      throw new Error('Expected resolvePiAgentImport to throw');
    } catch (error) {
      expect((error as Error).message).to.eql(
        `Missing deps import for package "${PI_AGENT_IMPORT_BASE}": /tmp/deps.yaml`,
      );
    }
  });

  it('pinPiAgentImport rejects unpinned or unexpected package specs', () => {
    expect(() => pinPiAgentImport('', PI_AGENT_IMPORT_BASE)).to.throw(
      `Expected pinned Pi coding agent npm specifier: ${PI_AGENT_IMPORT_BASE}`,
    );
  });

  it('pinPiAgentImport throws when the base seam is missing', () => {
    expect(() => pinPiAgentImport(resolverSource().replace(BASE_LINE, ''), NEXT_SPEC)).to.throw(
      'Could not locate PI_AGENT_IMPORT_BASE in m.core/m.cli/u.resolve.pkg.ts',
    );
  });

  it('pinPiAgentImport throws when the version seam is missing', () => {
    expect(() =>
      pinPiAgentImport(
        resolverSource().replace("const PI_AGENT_IMPORT_VERSION = '1.2.3' as const;", ''),
        NEXT_SPEC,
      )
    ).to.throw(
      'Could not locate PI_AGENT_IMPORT_VERSION in m.core/m.cli/u.resolve.pkg.ts',
    );
  });

  it('pinPiAgentImport throws when the import expression is missing', () => {
    expect(() => pinPiAgentImport(resolverSource().replace(IMPORT_LINE, ''), NEXT_SPEC)).to.throw(
      'Could not locate PI_AGENT_IMPORT expression in m.core/m.cli/u.resolve.pkg.ts',
    );
  });
});
