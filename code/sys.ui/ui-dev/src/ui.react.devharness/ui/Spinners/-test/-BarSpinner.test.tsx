import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from '../../../-test.ts';
import { BarSpinner } from '../mod.ts';

describe('DevHarness BarSpinner', () => {
  it('renders a named, indeterminate loading bar on the first render', () => {
    const html = renderToStaticMarkup(<BarSpinner />);
    expect(html).to.include('<progress');
    expect(html).to.include('aria-label="Loading"');
    expect(html).not.to.include(' value=');
  });
});
