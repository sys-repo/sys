import { describe, expect, it } from '../../-test.ts';
import { Xml } from '../mod.ts';

const SAMPLE_XML =
  '<testsuite tests="1"><testcase name="passes"><![CDATA[ok]]></testcase></testsuite>';

describe('Xml.Is', () => {
  it('exposes element, text, and CDATA guards', () => {
    const result = Xml.parse(SAMPLE_XML);
    if (!result.ok) throw result.error;

    const root = result.doc.root;
    const testcase = root.children.find(Xml.Is.element);
    if (!testcase) throw new Error('Expected testcase element.');

    expect(Xml.Is.element(root)).to.eql(true);
    expect(testcase.name.local).to.eql('testcase');
    expect(testcase.children.some(Xml.Is.text)).to.eql(false);
    expect(testcase.children.some(Xml.Is.cdata)).to.eql(true);
  });
});
