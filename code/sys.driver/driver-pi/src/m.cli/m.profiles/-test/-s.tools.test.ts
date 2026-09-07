import { describe, expect, it } from '../../../-test.ts';
import { Schema } from '../common.ts';
import { schema } from '../u.schema/s.root.ts';

describe('@sys/driver-pi/cli/Profiles/tools schema', () => {
  it('omission → keeps tools and each tool policy optional', () => {
    for (const input of [{}, { tools: {} }]) {
      expect(Schema.Value.Check(schema, input)).to.eql(true);
    }
    for (const name of ['remove', 'move', 'copy', 'ocr', 'zip']) {
      expect(Schema.Value.Check(schema, { tools: { [name]: {} } })).to.eql(true);
    }
  });

  it('enabled → accepts only booleans for each direct tool policy', () => {
    for (const name of ['remove', 'move', 'copy', 'zip']) {
      for (const enabled of [true, false]) {
        expect(Schema.Value.Check(schema, { tools: { [name]: { enabled } } })).to.eql(true);
      }
      for (const enabled of ['true', 1, null]) {
        expect(Schema.Value.Check(schema, { tools: { [name]: { enabled } } })).to.eql(false);
      }
    }
  });

  it('recursive → remains exclusive to remove and boolean-valued', () => {
    for (const recursive of [true, false]) {
      expect(Schema.Value.Check(schema, { tools: { remove: { recursive } } })).to.eql(true);
    }
    expect(Schema.Value.Check(schema, { tools: { remove: { recursive: 'true' } } })).to.eql(false);
    for (const name of ['move', 'copy', 'ocr', 'zip']) {
      expect(Schema.Value.Check(schema, { tools: { [name]: { recursive: true } } })).to.eql(false);
    }
  });

  it('OCR → keeps enablement inside the optional PDF policy', () => {
    expect(Schema.Value.Check(schema, { tools: { ocr: { pdf: {} } } })).to.eql(true);
    for (const enabled of [true, false]) {
      expect(Schema.Value.Check(schema, { tools: { ocr: { pdf: { enabled } } } })).to.eql(true);
    }
    expect(Schema.Value.Check(schema, { tools: { ocr: { enabled: true } } })).to.eql(false);
    expect(Schema.Value.Check(schema, { tools: { ocr: { pdf: { enabled: 'true' } } } })).to.eql(
      false,
    );
    expect(Schema.Value.Check(schema, { tools: { ocr: { pdf: { force: true } } } })).to.eql(false);
  });

  it('unknown fields → rejects extra tools, extra options, and ZIP extraction policy', () => {
    expect(Schema.Value.Check(schema, { tools: { unknown: {} } })).to.eql(false);
    for (const name of ['remove', 'move', 'copy', 'ocr', 'zip']) {
      expect(Schema.Value.Check(schema, { tools: { [name]: { force: true } } })).to.eql(false);
    }
    expect(Schema.Value.Check(schema, { tools: { zip: { extract: true } } })).to.eql(false);
  });
});
