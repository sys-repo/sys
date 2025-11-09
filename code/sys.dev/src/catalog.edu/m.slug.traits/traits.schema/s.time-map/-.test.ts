import { describe, expect, it } from '../../../-test.ts';
import { Value } from '../common.ts';
import { TimeMapSchema, Traits } from '../mod.ts';

describe('schema.time-map (root: Record<WebVTT, Record<string, unknown>>)', () => {
  const S = Traits.Schema.TimeMap.Map;

  it('API', () => {
    expect(Traits.Schema.TimeMap.Map).to.equal(TimeMapSchema);
  });

  describe('schema: root', () => {
    describe('valid', () => {
      it('valid: empty object', () => {
        expect(Value.Check(S, {})).to.eql(true);
      });

      it('valid: minimal entries with arbitrary metadata bag', () => {
        const ok = {
          '00:00:00.000': { name: 'Intro (with millis)' },
          '03:25.000': { video: '../video/0', text: 'Hello world.' },
        };
        expect(Value.Check(S, ok)).to.eql(true);
      });

      it('valid: MM:SS (hourless, no millis)', () => {
        const ok = { '59:59': { cue: 'end-of-minute' }, '00:00': { cue: 'origin' } };
        expect(Value.Check(S, ok)).to.eql(true);
      });

      it('valid: HH:MM:SS (with hours, no millis)', () => {
        const ok = { '12:34:56': { note: 'hh:mm:ss accepted' }, '00:00:00': { at: 'zero' } };
        expect(Value.Check(S, ok)).to.eql(true);
      });
    });

    describe('invalid', () => {
      it('invalid: non-WebVTT keys rejected', () => {
        const v = { x: 1 };
        const bads = [
          { meta: { any: 'thing' } }, // non-matching key
          { '0:0:0.000': v }, // single-digit segments
          { '60:00.000': v }, // minutes tens place out of range
          { '00:60:00.000': v }, // seconds out of range
          { '00:00:60.000': v },
          { '00:00:00,000': v }, // comma (SRT) not allowed
          { '00:00:00.00': v }, // not 3-digit millis
          { '00:00:00.0000': v }, // too many millis
          { '3:25.000': v }, // single-digit minutes
          { '3:25': v }, // single-digit minutes (no millis)
          { '123:00:00.000': v }, // hours must be exactly two digits if present
          { '123:00:00': v }, // same (no millis)
        ];
        for (const bad of bads) expect(Value.Check(S, bad)).to.eql(false, JSON.stringify(bad));
      });

      it('invalid: value at a key must be a Record<string, unknown>', () => {
        const bads = [
          { '00:00:01.000': 123 },
          { '00:00:01': true },
          { '59:59': 'media/intro' },
          { '12:34:56': ['array'] },
          { '00:00': null },
        ];
        for (const bad of bads) expect(Value.Check(S, bad)).to.eql(false, JSON.stringify(bad));
      });

      it('valid: realistic mixed object (loose per-entry bag)', () => {
        const ok = {
          '00:00': { video: '../video', name: 'Display Name', text: 'Hello world.' },
          '00:00:03.250': { name: 'Hook' },
          '00:01:00': { ref: 'chapters/1' },
          '05:30.500': { ref: 'chapters/2', name: 'Discussion' },
          '12:00:00': { name: 'Noon mark' },
        };
        expect(Value.Check(S, ok)).to.eql(true, JSON.stringify(ok));
      });
    });
  });
});
