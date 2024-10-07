import { css as emotionCss } from '@emotion/react';
import { describe, expect, it, type t } from '../../-test.ts';
import { Emotion } from './mod.ts';

/**
 * Underlying library (emotion-js) tests used to
 * establish baseline behavior before wrapping the API.
 */
describe('Lib: Emotion → https://emotion.sh/docs', () => {
  it('exists', () => {
    expect(Emotion.css).to.equal(emotionCss);
  });

  describe('Emotion.css', () => {
    it('simple', () => {
      const res = Emotion.css({ fontSize: 16 });
      expect(res.styles).to.include('font-size:16px;');
    });

    it('merged', () => {
      const a: t.CssProperties = { color: 'red', fontSize: 16 };
      const b: t.CssProperties = {
        background: 'blue',
        ':hover': { background: 'green' },
      };
      const res = Emotion.css(a, b);
      expect(res.styles).to.include('font-size:16px;');
      expect(res.styles).to.include('color:red;');
      expect(res.styles).to.include('background:blue;');
      expect(res.styles).to.include(':hover{background:green;}');
    });
  });
});
