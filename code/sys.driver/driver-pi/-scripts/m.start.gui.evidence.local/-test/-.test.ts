import { describe, Err, expect, it, type t } from '../../common.ts';
import { pkg } from '../../../src/pkg.ts';
import { START_GUI_RELEASE_EVIDENCE } from '../../../src/m.core/m.cli.profiles/u/u.start.gui.service.evidence.ts';
import { START_GUI_SERVICE } from '../../../src/m.core/m.cli.profiles/u/u.start.gui.service.ts';
import { renderEvidence, writeEvidenceWith } from '../mod.ts';

const EVIDENCE_LEAF = new URL(
  '../../../src/m.core/m.cli.profiles/u/u.start.gui.service.evidence.ts',
  import.meta.url,
);

const render = (expectedPkg: unknown) =>
  renderEvidence({
    manifestUrl: START_GUI_RELEASE_EVIDENCE.manifestUrl,
    integrity: START_GUI_RELEASE_EVIDENCE.integrity,
    expectedPkg: expectedPkg as t.Pkg,
  });

describe('driver-pi/scripts/m.start.gui.evidence.local', () => {
  it('binds one frozen generated tuple as the service source', () => {
    expect(START_GUI_SERVICE.source).to.equal(START_GUI_RELEASE_EVIDENCE);
    expect(START_GUI_RELEASE_EVIDENCE.manifestUrl).to.eql(
      'http://localhost:8080/dist.json',
    );
    expect(START_GUI_RELEASE_EVIDENCE.expectedPkg).to.eql(pkg);
    expect(Object.isFrozen(START_GUI_RELEASE_EVIDENCE)).to.eql(true);
    expect(Object.isFrozen(START_GUI_RELEASE_EVIDENCE.expectedPkg)).to.eql(true);
  });

  it('renders the checked-in evidence leaf byte-for-byte', async () => {
    const rendered = new TextEncoder().encode(renderEvidence(START_GUI_RELEASE_EVIDENCE));
    expect(await Deno.readFile(EVIDENCE_LEAF)).to.eql(rendered);
  });

  it('escapes admitted package strings as valid single-quoted TypeScript', () => {
    const source = render({
      name: "@sys/driver-'pi\\fixture",
      version: "0.0.0+'proof\\fixture",
    });
    expect(source).to.contain(`name: '@sys/driver-\\'pi\\\\fixture'`);
    expect(source).to.contain(`version: '0.0.0+\\'proof\\\\fixture'`);
  });

  it('rejects malformed package identity before rendering authority', () => {
    for (
      const value of [
        undefined,
        {},
        { name: '', version: '0.0.0' },
        { name: '@sys/driver-pi', version: '' },
        { name: '@sys/driver-pi', version: '0.0.0\nchanged' },
      ]
    ) {
      expect(() => render(value)).to.throw(
        'Driver Pi local GUI evidence package identity is invalid.',
      );
    }
  });

  it('rejects malformed URL and integrity authority before rendering', () => {
    expect(() =>
      renderEvidence({
        ...START_GUI_RELEASE_EVIDENCE,
        manifestUrl: 'http://localhost:8080/dist.json?mutable' as t.StringUrl,
      })
    ).to.throw('Driver Pi local GUI evidence manifest URL is invalid.');
    expect(() =>
      renderEvidence({
        ...START_GUI_RELEASE_EVIDENCE,
        integrity: `${START_GUI_RELEASE_EVIDENCE.integrity}:size=1` as t.StringHash,
      })
    ).to.throw('Driver Pi local GUI evidence integrity is invalid.');
  });

  it('fails closed when the evidence output write rejects', async () => {
    const reported = Err.std('denied');
    let thrown: unknown;
    try {
      await writeEvidenceWith('candidate', {
        writeTextFile: () => Promise.reject(reported),
      });
    } catch (cause) {
      thrown = cause;
    }

    expect(thrown).to.be.instanceOf(Error);
    expect((thrown as Error).message).to.eql(
      'Driver Pi local GUI evidence output write failed.',
    );
    expect((thrown as Error).cause).to.equal(reported);
  });
});
