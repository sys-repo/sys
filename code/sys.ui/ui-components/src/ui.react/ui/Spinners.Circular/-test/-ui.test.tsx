import { useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Spinners } from '@sys/ui-components/react/spinners';
import {
  act,
  afterAll,
  beforeAll,
  describe,
  DomMock,
  expect,
  it,
  TestReact,
} from '../../../-test.ts';
import { Color, Is, Style } from '../common.ts';

describe('Spinners.Circular: first paint', () => {
  it('renders a shaded, decorative glyph without a browser or effects', () => {
    const markup = renderToStaticMarkup(<Spinners.Circular />);
    expect(markup).to.include('<svg');
    expect(markup).to.include('width="22"').and.to.include('height="22"');
    expect(markup).to.include('aria-hidden="true"').and.to.include('focusable="false"');
    expect(markup).to.include('stroke="currentColor"');
    expect(markup.match(/<line\b/g)?.length).to.eql(12);
    expect(markup).to.include('stroke-opacity="1"').and.to.match(/stroke-opacity="0\.\d+"/);
  });
});

describe('Spinners.Circular: styling', () => {
  DomMock.init({ beforeAll, afterAll });

  it('scales the same drawing and resolves color from host → theme → caller style', async () => {
    const res = await TestReact.render(
      <>
        <Spinners.Circular />
        <Spinners.Circular size={32} theme='Dark' />
        <Spinners.Circular theme='Dark' style={{ color: 'rebeccapurple' }} />
      </>,
    );
    try {
      const [inherited, themed, styled] = res.container.querySelectorAll('svg');
      expect(themed.getAttribute('width')).to.eql('32');
      expect(themed.getAttribute('height')).to.eql('32');
      expect(themed.getAttribute('viewBox')).to.eql(inherited.getAttribute('viewBox'));
      expect(color(inherited)).to.eql(undefined);
      expect(color(themed)).to.eql(Color.theme('Dark').fg);
      expect(color(styled)).to.eql('rebeccapurple');
    } finally {
      act(() => res.dispose());
    }
  });

  it('micro → standard starts all petal clocks together; resizing within standard keeps them', async () => {
    let resize!: (size: number) => void;
    function Probe() {
      const [size, setSize] = useState(12);
      resize = setSize;
      return <Spinners.Circular size={size} />;
    }
    const res = await TestReact.render(<Probe />);
    const petals = () => Array.from(res.container.querySelectorAll('line'));
    try {
      const micro = petals();
      expect(micro).to.have.length(8);
      act(() => resize(22));
      const standard = petals();
      expect(standard).to.have.length(12);
      expect(standard.some((line) => micro.includes(line))).to.eql(false);
      act(() => resize(64));
      petals().forEach((line, index) => expect(line).to.equal(standard[index]));
    } finally {
      act(() => res.dispose());
    }
  });

  it('pulses fixed petals out of phase only when motion is enabled', async () => {
    const res = await TestReact.render(
      <>
        <Spinners.Circular size={12} />
        <Spinners.Circular size={16} />
      </>,
    );
    try {
      const groups = res.container.querySelectorAll('svg > g');
      expect(groups).to.have.length(2);
      const rules = Style.Dom.stylesheet().rules.items;
      for (const [index, count] of [8, 12].entries()) {
        const group = groups[index];
        const lines = group.querySelectorAll('line');
        expect(lines).to.have.length(count);
        const motion = rules.filter((e) =>
          !Is.nil(e.style.animation) && lines[0].matches(e.selector)
        );
        expect(motion).to.have.length(1);
        expect(motion[0].rule).to.include('@media (prefers-reduced-motion: no-preference)');
        const [pulse] = String(motion[0].style.animation).split(' ');
        const frames = rules.filter((e) => e.rule.startsWith(`@keyframes ${pulse} {`));
        const animated = frames.flatMap((e) => Object.keys(e.style));
        expect([...new Set(animated)]).to.eql(['strokeOpacity']);
        expect(new Set(Array.from(lines, (line) => line.style.animationDelay)).size).to.eql(count);
      }
    } finally {
      act(() => res.dispose());
    }
  });
});

function color(svg: SVGSVGElement) {
  const selector = `.${svg.getAttribute('class')}`;
  const rule = Style.Dom.stylesheet().rules.items.find((e) => e.selector === selector);
  if (Is.nil(rule)) throw new Error('Missing indicator root style.');
  return rule.style.color;
}
