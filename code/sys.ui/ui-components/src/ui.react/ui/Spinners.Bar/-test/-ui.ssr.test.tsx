import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from '../../../-test.ts';
import { Spinners } from '../../Spinners/mod.ts';

/**
 * No DomMock: this checks synchronous markup, not browser paint.
 */
describe('Spinners.Bar: server rendering', () => {
  it('renders the indicator without a browser or an effect', () => {
    const markup = renderToStaticMarkup(<Spinners.Bar transparentTrack />);
    expect(markup).to.not.be.empty;
  });
});
