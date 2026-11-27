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
import { Color } from '../common.ts';
import { Button } from '../mod.ts';
import { button, key } from './u.fixture.ts';
import { ruleText } from './u.fixture.focus.ts';

describe('Button: tone and keyboard focus', () => {
  DomMock.init({ beforeAll, afterAll });

  for (const theme of ['Light', 'Dark'] as const) {
    it(`${theme}: accent is an available action colour, not hover or disabled state`, async () => {
      using res = await TestReact.render(
        <>
          <Button theme={theme}>Neutral</Button>
          <Button theme={theme} tone='accent' opacity={({ is }) => is.over ? 0.5 : 1}>Edit</Button>
          <Button theme={theme} tone='accent' enabled={false}>Disabled</Button>
          <Button theme={theme} tone='accent' active={false}>Inactive</Button>
        </>,
      );
      const [neutral, accent, disabled, inactive] = res.container.children;
      const color = theme === 'Dark' ? Color.WHITE : Color.DARK;
      const blue = theme === 'Dark' ? Color.lighten(Color.BLUE, 10) : Color.darken(Color.BLUE, 10);
      expect(ruleText(accent.firstElementChild!)).to.include(`color: ${blue};`);
      expect(ruleText(accent)).to.include('opacity: 1;');
      for (const el of [neutral, disabled, inactive]) {
        expect(ruleText(el.firstElementChild!)).to.include(`color: ${color};`);
      }
    });
  }

  it('caller-owned child focus styling leaves the action keyboard-operable', async () => {
    let calls = 0;
    using res = await TestReact.render(
      <Button
        onClick={() => calls++}
        style={{ ':focus-visible': { outline: 'none', '--child-outline': '2px solid red' } }}
      >
        <span style={{ outline: 'var(--child-outline)' }}>Run</span>
      </Button>,
    );
    const root = button(res.container);
    const child = root.querySelector('span')!;
    expect(ruleText(root, ':focus-visible')).to.include('--child-outline: 2px solid red;');
    act(() => root.focus());
    key(root, 'keydown', ' ');
    key(root, 'keyup', ' ');
    expect(calls).to.eql(1);
    expect(root.querySelector('span')).to.equal(child);
  });

  it('caller palette, width and offset configure the ring without replacing focus', async () => {
    using res = await TestReact.render(
      <Button
        style={{
          '--sys-button-focus-accent': 'orange',
          '--sys-button-focus-rest': 'maroon',
          '--sys-button-focus-width': '3px',
          '--sys-button-focus-offset': '4px',
        }}
      >
        Run
      </Button>,
    );
    const root = button(res.container);
    const base = ruleText(root);
    expect(base).to.include('--sys-button-focus-accent: orange;');
    expect(base).to.include('--sys-button-focus-rest: maroon;');
    expect(base).to.include('--sys-button-focus-width: 3px;');
    expect(base).to.include('--sys-button-focus-offset: 4px;');
    const focus = ruleText(root, ':focus-visible');
    expect(focus).to.include('var(--sys-button-focus-rest)');
    expect(focus).to.include('var(--sys-button-focus-width)');
    expect(focus).to.include('var(--sys-button-focus-offset)');
  });
});
