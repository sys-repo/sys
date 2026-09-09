import { describe, expect, it } from '../../-test.ts';
import { Xml } from '../mod.ts';

const SAMPLE_XML =
  '<testsuite tests="1"><testcase name="passes"><![CDATA[ok]]></testcase></testsuite>';

describe('Xml.parse', () => {
  it('parses XML into a data-first result', () => {
    const result = Xml.parse(SAMPLE_XML);

    expect(result.ok).to.eql(true);
    if (result.ok) {
      expect(result.doc.root.name.local).to.eql('testsuite');
      expect(result.doc.root.attributes.tests).to.eql('1');
    }
  });

  it('reports malformed XML without throwing', () => {
    const result = Xml.parse('<testsuite>');

    expect(result.ok).to.eql(false);
    if (!result.ok) {
      expect(result.error.name).to.eql('XmlSyntaxError');
      expect(Boolean(result.error.message.trim())).to.eql(true);
    }
  });

  it('keeps DOCTYPE disabled through the facade', () => {
    const result = Xml.parse('<!DOCTYPE root><root />');

    expect(result.ok).to.eql(false);
    if (!result.ok) expect(result.error.message).to.contain('DOCTYPE');
  });
});
