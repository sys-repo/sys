import { describe, expect, it } from '../../../-test.ts';
import { Pattern } from '../mod.ts';

describe('PatternRecipe.Type.Mime', () => {
  const pattern = Pattern.Type.Mime().pattern;
  const re = new RegExp(pattern);

  it('pattern is defined', () => {
    expect(pattern, 'MIME pattern must be a string').to.be.a('string');
  });

  it('accepts common media types', () => {
    const ok = [
      'image/png',
      'application/pdf',
      'text/plain',
      'audio/mpeg',
      'video/mp4',
      'application/vnd.google-apps.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/x-markdown',
      'application/x-www-form-urlencoded',
      'application/ld+json',
      'application/vnd.mapbox-vector-tile',
    ];
    for (const s of ok) expect(re.test(s), s).to.eql(true);
  });

  it('allows uppercase (tokens are case-insensitive by spec, pattern permits A–Z)', () => {
    const ok = ['IMAGE/PNG', 'Application/LD+JSON', 'TEXT/PLAIN'];
    for (const s of ok) expect(re.test(s), s).to.eql(true);
  });

  it('rejects malformed values', () => {
    const bad = [
      '', // empty
      'image', // missing subtype
      'image/', // missing subtype token
      '/png', // missing type token
      'image\\png', // backslash not allowed
      'image//png', // double slash
      'image/png; charset=utf-8', // parameters not allowed here
      'image/pn*g', // asterisk not allowed
      'image/pŋg', // non-ASCII
      ' image/png', // leading space
      'image/png ', // trailing space
      'imáge/png', // diacritic in token
      'application//json',
      'application/json/xml', // extra slash
      'application/', // missing subtype
    ];
    for (const s of bad) expect(re.test(s), s).to.eql(false);
  });
});
