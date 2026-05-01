import { describe, expect, it } from '../../src/-test.ts';
import { pinPiCodingAgentImport, resolvePiCodingAgentImport, type DenoDepsLib } from '../-prep.u.ts';

describe('driver-agent/scripts/-prep', () => {
  it('pins PI_CODING_AGENT_IMPORT to the target deps authority version', () => {
    const source = `
export const PI_CODING_AGENT_IMPORT = 'npm:@mariozechner/pi-coding-agent@0.65.2' as const;
const x = 1;
`;
    const res = pinPiCodingAgentImport(source, 'npm:@mariozechner/pi-coding-agent@0.66.1');
    expect(res).to.contain(
      `export const PI_CODING_AGENT_IMPORT = 'npm:@mariozechner/pi-coding-agent@0.66.1' as const;`,
    );
  });

  it('pinPiCodingAgentImport is idempotent when already pinned to target version', () => {
    const source = `
export const PI_CODING_AGENT_IMPORT = 'npm:@mariozechner/pi-coding-agent@0.66.1' as const;
`;
    const res = pinPiCodingAgentImport(source, 'npm:@mariozechner/pi-coding-agent@0.66.1');
    expect(res).to.eql(source);
  });

  it('resolvePiCodingAgentImport reads the package spec from deps authority', async () => {
    const stub: DenoDepsLib = {
      from(source) {
        expect(source).to.eql('/tmp/deps.yaml');
        return Promise.resolve({
          error: undefined,
          data: { deps: [{ import: 'npm:@mariozechner/pi-coding-agent@0.66.1' }] },
        });
      },
      findImport(_deps, input) {
        expect(input).to.eql('npm:@mariozechner/pi-coding-agent');
        return 'npm:@mariozechner/pi-coding-agent@0.66.1';
      },
    };

    const version = await resolvePiCodingAgentImport('/tmp/deps.yaml', stub);
    expect(version).to.eql('npm:@mariozechner/pi-coding-agent@0.66.1');
  });

  it('resolvePiCodingAgentImport throws when deps authority is missing the package', async () => {
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
      await resolvePiCodingAgentImport('/tmp/deps.yaml', stub);
      throw new Error('Expected resolvePiCodingAgentImport to throw');
    } catch (error) {
      expect((error as Error).message).to.eql(
        'Missing deps import for package "npm:@mariozechner/pi-coding-agent": /tmp/deps.yaml',
      );
    }
  });

  it('pinPiCodingAgentImport throws when marker constant is missing', () => {
    expect(() => pinPiCodingAgentImport(`const X = 'npm:@mariozechner/pi-coding-agent@0.66.1';`, 'npm:@mariozechner/pi-coding-agent@0.66.1'))
      .to.throw('Could not locate PI_CODING_AGENT_IMPORT constant in m.pi/m.cli/u.resolve.pkg.ts');
  });
});
