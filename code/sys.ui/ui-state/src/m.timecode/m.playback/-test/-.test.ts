import { describe, expect, it } from '../../../-test.ts';
import { Timecode } from '../../mod.ts';
import { Playback } from '../mod.ts';

describe(`Timecode.Playback (state machine)`, () => {
  it('API', () => {
    expect(Timecode.Playback).to.equal(Playback);
  });
});
