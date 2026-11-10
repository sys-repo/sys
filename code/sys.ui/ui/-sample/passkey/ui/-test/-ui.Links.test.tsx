import React from 'react';
import { Dev } from '@sys/ui-components/react/dev';
import { afterAll, beforeAll, Color, describe, DomMock, expect, it, TestReact } from './common.ts';
import { SpecLink } from '../../-ui.Links.tsx';
import { SpecLinks } from '../../-u.navigation.ts';

describe('Passkey specimen links', () => {
  DomMock.init({ beforeAll, afterAll });

  for (const to of ['view', 'sample'] as const) {
    it(`${to} → public Dev composition with unchanged reciprocal navigation`, async () => {
      const link = SpecLinks[to];
      const res = await TestReact.render(
        <>
          <SpecLink to={to} />
          <Dev.Link href={link.href} openIn='self' theme={Color.theme().name}>
            {link.label}
          </Dev.Link>
        </>,
      );
      try {
        const [anchor, expected] = res.container.querySelectorAll('a');
        expect(anchor.textContent).to.eql(SpecLinks[to].label);
        expect(anchor.getAttribute('href')).to.eql(SpecLinks[to].href);
        expect(anchor.target).to.eql('_self');
        expect(anchor.hasAttribute('aria-describedby')).to.eql(false);
        expect(anchor.outerHTML).to.eql(expected.outerHTML);
      } finally {
        React.act(() => res.dispose());
      }
    });
  }
});
